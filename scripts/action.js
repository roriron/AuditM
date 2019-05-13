(function () {
  'use strict';
  const root = document.body;
  //--------Data-------------------------------------
  const Auth = {
    user: null,
    isTechnologist:false,
    setUser: function (user) {
      Auth.user = user;
      if (Auth.user) {
        if (Auth.user.displayName.split("-")[1] != "NA")
          Auth.isTechnologist=true;
      }
      m.redraw();
    },
    getSection: function () {
      if (Auth.user) {
        if (Auth.isTechnologist)
          return Auth.user.displayName.split("-")[1];
        else
          return Auth.user.displayName.split("-")[0];
      }
      else
        return "";
    },
    getEmail: function () {
      if (Auth.user) {
        return Auth.user.email.split("@")[0];
      }
      else
        return "";
    }
  };
  const AllActionData = {
    data:"none",
    area:[],
    filter:"All",
    currentNC: {
      finding: "",
      action: "",
      comment: "",
      itemarea: "",
      itemtext: "",
      itemcriteria: "",
      area: ""
    },
    isSaving: false,
    ispending: true,
    oninit: function () {
      AllActionData.area=[];
      db.collection("ncitems").where("section", "==", Auth.getSection())
        .get()
        .then(function (querySnapshot) {
          AllActionData.data = [];
          querySnapshot.forEach(function (doc) {
            let data = doc.data();
            Object.keys(data).forEach(function (itemkey) {
              if (data[itemkey].hasOwnProperty("itemarea")) {
                data[itemkey]['itemkey'] = itemkey;
                data[itemkey]['schedulekey'] = doc.id;
                data[itemkey]['area'] = doc.data()["area"];
                AllActionData.data.push(data[itemkey]);
                if(AllActionData.area.indexOf(doc.data()["area"])<0) AllActionData.area.push(doc.data()["area"]);
              }
            });
          });
          AllActionData.data.sort(function (a, b) {
            return b.deadline - a.deadline;
          });
         // console.log(AllActionData.area);
          m.redraw();
        }).catch(function (error) {
          console.log("Error getting documents: ", error);
          M.toast({ html: 'Error getting nc items: ' + error });
        });
    },
    onClickNC: function (vnode) {
      AllActionData.currentNC = AllActionData.data.find(function (element) {
        return element["schedulekey"] == vnode.attrs.ncitem.schedulekey && element["itemkey"] == vnode.attrs.ncitem.itemkey;
      });
    },
    onSaveComment: function (vnode) {
      let schedulekey = vnode.attrs.data.schedulekey;
      let itemkey = vnode.attrs.data.itemkey;
      let comment = vnode.dom.querySelector("textarea").value;
      let deadline = new Date(vnode.dom.querySelector(".datepicker").value);
      let status = vnode.dom.querySelector("select").value;
      let ncref = db.collection("ncitems").doc(schedulekey);
      AllActionData.isSaving = true;
      db.runTransaction(function (transaction) {
        return transaction.get(ncref).then(function (doc) {
          if (!doc.exists) {
            throw "Document does not exist!";
          }
          let mydata = doc.data();
          mydata[itemkey]["status"] = status;
          let countnc = Object.keys(mydata).filter(function (item) { return (mydata[item]["status"] == "pending") || (mydata[item]["status"] == "in-progress"); }).length;
          let resultref = db.collection("auditresults").doc('result');
          let result = {};
          result[schedulekey] = { pending: countnc };
          let ncitems = {};
          ncitems[itemkey] = {
            status: status,
            comment: comment,
            commentby: Auth.getEmail(),
            commenttime: firebase.firestore.FieldValue.serverTimestamp(),
            deadline: deadline
          };
          transaction.set(resultref, result, { merge: true });
          transaction.set(ncref, ncitems, { merge: true });
        }).then(function () {
          let newdata = AllActionData.data.find(function (element) {
            return element["schedulekey"] == schedulekey && element["itemkey"] == itemkey;
          });
          newdata["status"] = status;
          newdata["comment"] = comment;
          newdata["deadline"] = { seconds: Math.round((deadline.getTime()) / 1000) };
          AllActionData.isSaving = false;
          m.redraw();
          M.toast({ html: 'Saved!' });
        });
      }).catch(function (err) {
        console.error(err);
        AllActionData.isSaving = false;
        M.toast({ html: 'Error save documents: ' + error });
      });
    },
    onSaveAction: function (vnode) {
     // console.log(vnode);
      let schedulekey = vnode.attrs.data.schedulekey;
      let itemkey = vnode.attrs.data.itemkey;
      let action = vnode.dom.querySelector("textarea").value;
      let status = vnode.dom.querySelector("select").value;
      let ncref = db.collection("ncitems").doc(schedulekey);
      AllActionData.isSaving = true;
      db.runTransaction(function (transaction) {
        return transaction.get(ncref).then(function (doc) {
          if (!doc.exists) {
            throw "Document does not exist!";
          }
          let mydata = doc.data();
          mydata[itemkey]["status"] = status;
          let countnc = Object.keys(mydata).filter(function (item) { return (mydata[item]["status"] == "pending") || (mydata[item]["status"] == "in-progress"); }).length;
          let resultref = db.collection("auditresults").doc('result');
          let result = {};
          result[schedulekey] = { pending: countnc };
          let ncitems = {};
          ncitems[itemkey] = {
            status: status,
            action: action,
            actionby: Auth.getEmail(),
            actiontime: firebase.firestore.FieldValue.serverTimestamp(),
          };
          transaction.set(resultref, result, { merge: true });
          transaction.set(ncref, ncitems, { merge: true });
        }).then(function () {
          let newdata = AllActionData.data.find(function (element) {
            return element["schedulekey"] == schedulekey && element["itemkey"] == itemkey;
          });
          newdata["status"] = status;
          newdata["action"] = action;
          AllActionData.isSaving = false;
          m.redraw();
          M.toast({ html: 'Saved!' });
        });
      }).catch(function (err) {
        console.error(err);
        AllActionData.isSaving = false;
        M.toast({ html: 'Error save documents: ' + error });
      });
    },
    SetFilter:function(area){
     // console.log(area);
      AllActionData.filter=area;
    }

  };
  const HomeScreen = {
    view: function (vnode) {
      return  [
        m(AppHeader),

        m(".has-fixed-sidenav", m(ActionContainer)),

        m(ActionModal, { data: AllActionData.currentNC, onSaveNC: AllActionData.onSaveAction }),
        m(CommentModal, { data: AllActionData.currentNC, onSaveNC: AllActionData.onSaveComment }),
        m(AppFooter)
      ];
    }
  };
  const AppFooter = {
    oncreate: function (vnode) {
      M.Tabs.init(vnode.dom.querySelector(".tabs"));
    },
    onupdate: function (vnode) {
      M.Tabs.init(vnode.dom.querySelector(".tabs"));
    },

    view: function (vnode) {
      return m(".footerbar.primarycolor.has-fixed-sidenav",
       m("ul.tabs.tabs-transparent",
      [
        m("li.tab", 
          m("a[href='#']", {area:'All', onclick:  m.withAttr("area", AllActionData.SetFilter) },
            "All"
          )
        ),
        AllActionData.area.map(function(area){
          return m("li.tab", 
          m("a[href='#']", {area:area, onclick:  m.withAttr("area", AllActionData.SetFilter) },
            area
          )
        );
        })
       
      ]
    ));

    }
  };

  const ActionContainer = {
    view: function () {
      return m(".row.containerwithfooter", AllActionData.data=="none"?m(Loading):
        AllActionData.data.map(function (ncitem) {
          if ((((Auth.isTechnologist) || ncitem["status"] != "done") && (ncitem["status"] != "completed")) || (!AllActionData.ispending))
           if(AllActionData.filter=="All"||AllActionData.filter==ncitem["area"])
          return m(NCItemCard, { ncitem: ncitem, onClickNC: AllActionData.onClickNC });
        })
      );
    }
  };
  const AppHeader = {
    oncreate: function (vnode) {
      M.Tabs.init(vnode.dom.querySelector(".tabs"));
      M.Sidenav.init(vnode.dom.querySelector(".sidenav"));
    },
    view: function () {
      return m("div", [
        m("ul.sidenav.sidenav-fixed[id='slide-out']",
          [
            m("a.sidenav-close.right.hide-on-large-only[href='#!']",
              m("i.material-icons",
                "close"
              )
            ),
            m("li",
              m("a[href='index.html']",
                [
                  m("i.material-icons",
                    "person"
                  ),
                  m("span.currentuser",
                    Auth.getEmail()
                  )
                ]
              )
            ),
            m("li",
              m(".divider")
            ),
            m("li",
              m("a[href='schedule.html']",
                [
                  m("i.material-icons",
                    "date_range"
                  ),
                  "My schedules"
                ]
              )
            ),
            m("li",
              m("a[href='action.html']",
                [
                  m("i.material-icons",
                    "assignment_turned_in"
                  ),
                  "My actions"
                ]
              )
            ),
            m("li",
              m(".divider")
            ),
            m("li",
              m("a[href='performance.html']",
                [
                  m("i.material-icons",
                    "timeline"
                  ),
                  "Performance"
                ]
              )
            ),
            m("li.hide-on-med-and-down",
              m("a[href='report.html']",
                [
                  m("i.material-icons",
                    "assignment"
                  ),
                  "Report"
                ]
              )
            )
          ]
        ),
        m("nav.nav-extended.primarycolor.has-fixed-sidenav",
          [
            m(".nav-wrapper",
              [
                m("a.brand-logo.center[href='#']",
                  "Action"
                ),
                m("a.sidenav-trigger[data-target='slide-out'][href='#']",
                  m("i.material-icons",
                    "menu"
                  )
                )
              ]
            ),
            m(".nav-content",
              m("ul.tabs.tabs-transparent.tabs-fixed-width",
                [
                  m("li.tab",
                    m("a[href='#tabPendingAction']", { onclick: function () { AllActionData.ispending = true; } },
                      "Pending"
                    )
                  ),
                  m("li.tab",
                    m("a[href='#tabAllActions']", { onclick: function () { AllActionData.ispending = false; } },
                      "All"
                    )
                  )
                ]
              )
            )
          ]
        )])
        ;
    }
  };
  const NCItemCard = {
    view: function (vnode) {
      return m(".container",
       m(".card.row",
        [
          m(".card-content",
            [
              m("p.text20.accenttextcolor", vnode.attrs.ncitem.area),
              m("span.primarytextcolor.textbold", vnode.attrs.ncitem.itemarea),
              m("span.right", vnode.attrs.ncitem.itemkey),
              m("p", vnode.attrs.ncitem.itemtext),
              m("p.textitalic", vnode.attrs.ncitem.itemcriteria),
                m("img[height='auto'][width='100%'][id='inputpicture']", { class: vnode.attrs.ncitem.pictureURL == "" ? "hide" : "" , src: vnode.attrs.ncitem.pictureURL }),
              m("p.text12.upperheader.secondarytextcolor", "Finding:"),
              m("p.lowertext", vnode.attrs.ncitem.finding),
              m("p.text12.upperheader.secondarytextcolor", "Action:"),
              m("p.lowertext", vnode.attrs.ncitem.action),
              m("p.text12.upperheader.secondarytextcolor", "Comment:"),
              m("p.lowertext", vnode.attrs.ncitem.comment),
              m("p.text12.upperheader.secondarytextcolor", "Deadline:"),
              m("p.lowertext", fbTimeToDDMMMYYYY(vnode.attrs.ncitem.deadline))
            ]
          ),
          m(".divider"),
          m("div",
            [
              m("a.col.btn-flat.modal-trigger.waves-effect.waves-teal[href='#actionmodal']", { class: ((!Auth.isTechnologist) && (vnode.attrs.ncitem.status != "done") && (vnode.attrs.ncitem.status != "completed")) ? (AllActionData.isSaving ? "disabled" : "") : "hide", onclick: vnode.attrs.onClickNC.bind(this, vnode) },
                [
                  m("i.material-icons.left",
                    "create"
                  ),
                  "Action"
                ]
              ),
              m("a.col.btn-flat.modal-trigger.waves-effect.waves-teal[href='#commentmodal']", { class: ((Auth.isTechnologist) && (vnode.attrs.ncitem.status !== "completed")) ? (AllActionData.isSaving ? "disabled" : "") : "hide", onclick: vnode.attrs.onClickNC.bind(this, vnode) },
                [
                  m("i.material-icons.left",
                    "create"
                  ),
                  "Comment"
                ]
              ),
              m("p.col.right.uppercase.footertext", vnode.attrs.ncitem.status
              )
            ]
          )
        ]
      ))
    }
  };
  const ActionModal = {
    onupdate: function (vnode) {
      M.updateTextFields(vnode.dom);
      M.FormSelect.init(vnode.dom.querySelector("select"));
    },
    oncreate: function (vnode) {
      let elem = document.getElementById('actionmodal');
      M.Modal.init(elem, { dismissible: false });
    },
    view: function (vnode) {
      return m(".modal.fullscreenmodal[id='actionmodal']",
        [
          m(".modal-content",
            [
              m("p.col.s12.text20.accenttextcolor",
                vnode.attrs.data.area
              ),
              m(".row",
                [
                  m("p.col.s12.primarytextcolor.textbold",
                    vnode.attrs.data.itemarea
                  ),
                  m("p.col.s12",
                    vnode.attrs.data.itemtext
                  ),
                  m("p.col.s12.textitalic",
                    vnode.attrs.data.itemcriteria
                  ),
                  m("p.text12.upperheader.secondarytextcolor", "Finding:"),
                  m("p.lowertext", vnode.attrs.data.finding),
                  m("p.text12.upperheader.secondarytextcolor", "Comment:"),
                  m("p.lowertext", vnode.attrs.data.comment),
                ]),
              m(".input-field",
                [
                  m("textarea.materialize-textarea[id='textareaactionmodal']", { value: vnode.attrs.data.action }),
                  m("label[for='textareaactionmodal']",
                    'Action'
                  )
                ]
              ),
              m(".input-field",
                [
                  m("select", { value: vnode.attrs.data.status },
                    [
                      m("option[value='pending']",
                        "Pending"
                      ),
                      m("option[value='in-progress']",
                        "In-progress"
                      ),

                      m("option[value='done']",
                        "Done"
                      ),
                      m("option[disabled=true][value='completed']",
                        "Completed"
                      )
                    ]
                  ),
                  m("label",
                    "Status"
                  )
                ]
              )

            ]
          ),
          m(".modal-footer",
            [m("a.modal-close.waves-effect.waves-green.btn-flat[href='#!']", { onclick: vnode.attrs.onSaveNC.bind(this, vnode) },
              "SAVE"
            ),
            m("a.modal-close.waves-effect.waves-red.btn-flat[href='#!']",
              "CANCEL"
            )]
          )
        ]
      )
    }
  };
  const CommentModal = {
    onupdate: function (vnode) {
      M.updateTextFields(vnode.dom.querySelector("textarea"));
      M.FormSelect.init(vnode.dom.querySelector("select"));
      M.Datepicker.init(vnode.dom.querySelector(".datepicker"), { format: 'dd-mmm-yyyy' });
    },
    oncreate: function (vnode) {
      let elem = document.getElementById('commentmodal');
      M.Modal.init(elem, { dismissible: false });
    },
    view: function (vnode) {
      return m(".modal.fullscreenmodal[id='commentmodal']",
        [
          m(".modal-content",
            [
              m("p.col.s12.text20.accenttextcolor",
                vnode.attrs.data.area
              ),
              m(".row",
                [
                  m("p.col.s12.primarytextcolor.textbold",
                    vnode.attrs.data.itemarea
                  ),
                  m("p.col.s12",
                    vnode.attrs.data.itemtext
                  ),
                  m("p.col.s12.textitalic",
                    vnode.attrs.data.itemcriteria
                  ),
                  m("p.text12.upperheader.secondarytextcolor", "Finding:"),
                  m("p.lowertext", vnode.attrs.data.finding),
                  m("p.text12.upperheader.secondarytextcolor", "Action:"),
                  m("p.lowertext", vnode.attrs.data.action),
                ]),
              m(".input-field",
                [
                  m("textarea.materialize-textarea[id='textareacommentmodal']", { value: vnode.attrs.data.comment }),
                  m("label[for='textareacommentmodal']",
                    'Comment'
                  )
                ]
              ),
              m(".input-field",
                [
                  m("select", { value: vnode.attrs.data.status },
                    [
                      m("option[value='pending']",
                        "Pending"
                      ),
                      m("option[value='in-progress']",
                        "In-progress"
                      ),

                      m("option[disabled=true][value='done']",
                        "Done"
                      ),
                      m("option[value='completed']",
                        "Completed"
                      )
                    ]
                  ),
                  m("label",
                    "Status"
                  )
                ]
              ),
              m(".input-field",
                [
                  m("input.datepicker[type='text']", { value: fbTimeToDDMMMYYYY(vnode.attrs.data.deadline) }),
                  m("label.active",
                    "Deadline"
                  )
                ]
              )
            ]
          ),
          m(".modal-footer",
            [m("a.modal-close.waves-effect.waves-green.btn-flat[href='#!']", { onclick: vnode.attrs.onSaveNC.bind(this, vnode) },
              "SAVE"
            ),
            m("a.modal-close.waves-effect.waves-red.btn-flat[href='#!']",
              "CANCEL"
            )]
          )
        ]
      )
    }
  };
  const Loading={
    view:function(vnode){
      return m(".loaderpanel",
       m(".preloader-wrapper.active", 
      m(".spinner-layer.spinner-blue-only",
        [
          m(".circle-clipper.left", 
            m(".circle")
          ),
          m(".gap-patch", 
            m(".circle")
          ),
          m(".circle-clipper.right", 
            m(".circle")
          )
        ]
      )
    ));
    }

  };
  m.mount(root, HomeScreen);

  function getDoc(collectionid, docid) {
    return new Promise(function (resolve, reject) {
      return db.collection(collectionid).doc(docid)
        .get()
        .then(function (doc) {
          if (doc.exists) {
            return resolve(doc.data());
          } else {
            return resolve({});
          }
        }).catch(function (error) {
          return reject(error);
        });
    });
  }

  function getItemData(section, area) {
    return new Promise(function (resolve, reject) {
      return db.collection("appdata").where("area", "==", area).where("section", "==", section).limit(1)
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            return resolve(doc.data());
           // console.log(doc);
          });

          return resolve({});
        }).catch(function (error) {
          return reject(error);
        });
    });
  }
  function getSchedules(auditor, user, lastDay) {
    return new Promise(function (resolve, reject) {
      var schedules = [];
      return db.collection("auditschedules").where(auditor, "==", user).where("auditmonth", "<=", lastDay)
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            schedules.push({ docdata: doc.data(), docid: doc.id });
          });
          return resolve(schedules);
        })
        .catch(function (error) {
          return reject(error);
        });
    });
  }


  //-------------------------------------------------

  //----------------------Firebase user event-----------------------------   
  firebase.auth().onAuthStateChanged(function (firebaseUser) {
    if (firebaseUser) {
      Auth.setUser(firebaseUser);
      console.log('logged in');
      if (firebaseUser.emailVerified) {
        console.log('verified');
        AllActionData.oninit();
        // getItemData("BRW", "BH2");
        // Test();
      }
      else {
        window.location.href = "index.html";
      }

    } else {
      console.log('not logged in');
      window.location.href = "index.html";
    } // end else statement
  }); // end function

}());