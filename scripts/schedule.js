(function () {
  'use strict';
  const root = document.querySelector(".main");
  //console.log("file 2");
  //--------Data-------------------------------------
  const Auth = {
    user: null,
    setUser: function (user) {
      Auth.user = user;
    },
    getEmail: function () {
      if (Auth.user) {
        return Auth.user.email.split("@")[0];
      }
      else
        return "";
    },
    signOut: function () {
      console.log("Try to log out");
      firebase.auth().signOut().then(function () {
        M.toast({ html: 'Sign out' });
        // m.route.set("/signin");
      }).catch(function (error) {
        M.toast({ html: 'Error: ' + error });
      });

    }
  };
  const AllSchedulesData = {
    data: "none",
    ispending: true,
    schedulekey: "",
    prepareSubmit: function (schedulekey) {
      AllSchedulesData.schedulekey = schedulekey;
    },
    notSubmit: function () {
      AllSchedulesData.schedulekey = "";
    },
    submit: function () {
      let schedulekey = AllSchedulesData.schedulekey;
      console.log("submit: " + schedulekey);
      // AllSchedulesData.issaving = true;
      var ncref = db.collection("ncitems").doc(schedulekey);
      db.runTransaction(function (transaction) {
        return transaction.get(ncref).then(function (doc) {
          let mydata = {};
          var countnc = 0;
          var countpending = 0;
          if (doc.exists) {
            mydata = doc.data();
            for (var k in mydata) {
              if (mydata[k].hasOwnProperty("status")) {
                let deadline = new Date();
                mydata[k]["deadline"] = new Date(deadline.setDate(deadline.getDate() + 14));
                ++countnc;
                if (mydata[k][status] != "completed" && mydata[k][status] != "done") {
                  ++countpending;
                }
              }
            }
          }
          console.log(countnc, countpending);
          mydata['section'] = AllSchedulesData.data[schedulekey].section;
          mydata['area'] = AllSchedulesData.data[schedulekey].area;
          let auditresult = {};
          auditresult[schedulekey] = {
            auditmonth: AllSchedulesData.data[schedulekey].auditmonth,
            nc: countnc,
            pending: countpending,
            score: 100 * AllSchedulesData.data[schedulekey].passitem / AllSchedulesData.data[schedulekey].totalitem,
            target: AllSchedulesData.data[schedulekey].target,
            area: AllSchedulesData.data[schedulekey].area,
            section: AllSchedulesData.data[schedulekey].section
          };
          var resultref = db.collection("auditresults").doc("result");
          transaction.set(resultref, auditresult, { merge: true });
          var scheduleref = db.collection("auditschedules").doc(schedulekey)
          transaction.set(scheduleref, { status: "completed" }, { merge: true });
          transaction.set(ncref, mydata);
        });
      }).then(function () {
        AllSchedulesData.data[schedulekey].status = "completed";
        if (AllSchedulesData.schedulekey == schedulekey) AllSchedulesData.schedulekey = "";
        m.redraw();

        M.toast({ html: 'Submitted' });

      }).catch(function (error) {
        if (AllSchedulesData.schedulekey == schedulekey) AllSchedulesData.schedulekey = "";
        m.redraw();
        M.toast({ html: 'Error: ' + error });
      });

    },
    oninit: function () {
      let date = new Date();
      let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      Promise.all([getSchedules("auditor1", Auth.getEmail(), lastDay), getSchedules("auditor2", Auth.getEmail(), lastDay)])
        .then(function (values) {
          let allvalues = values[0].concat(values[1]);
          allvalues.sort(function (a, b) {
            return b.docdata.auditmonth.seconds - a.docdata.auditmonth.seconds;
          });
          //console.log(allvalues);
          AllSchedulesData.data = {};
          allvalues.forEach(function (schedule) {
            AllSchedulesData.data[schedule.docid] = schedule.docdata;
          });
          m.redraw();
        });
    }

  };
  const AuditItemsData = {
    audititems: {},//result
    itemdata: {},//text data
    ncitems: {},
    schedulekey: "",
    cansave: false,
    issaving: false,
    itemkey: "",
    newpictureURL: "",
    isChanged: false,
    currentnc: {
      itemtext: "",
      itemarea: "",
      itemcriteria: "",
      finding: "",
      pictureURL: ""
    },
    toScheduleScreen: function () {
      m.mount(root, HomeScreen);
    },
    checkSaveandLeave: function () {
      if (AuditItemsData.isChanged) {
        let elem = document.querySelector("#saveAuditModal");
        M.Modal.getInstance(elem).open();
      } else
        m.mount(root, HomeScreen);
    },
    setCurrentNC: function (itemkey) {
      AuditItemsData.newpictureURL = "";

      AuditItemsData.itemkey = itemkey;
      if (AuditItemsData.ncitems.hasOwnProperty(itemkey)) {
        AuditItemsData.currentnc = {
          itemtext: AuditItemsData.itemdata[itemkey].itemtext,
          itemarea: AuditItemsData.itemdata[itemkey].itemarea,
          itemcriteria: AuditItemsData.itemdata[itemkey].itemcriteria,
          finding: AuditItemsData.ncitems[itemkey].finding,
          action: "",
          comment: "",
          status: "pending",
          pictureURL: AuditItemsData.ncitems[itemkey].pictureURL
        };

      } else {
        AuditItemsData.currentnc = {
          itemtext: AuditItemsData.itemdata[itemkey].itemtext,
          itemarea: AuditItemsData.itemdata[itemkey].itemarea,
          itemcriteria: AuditItemsData.itemdata[itemkey].itemcriteria,
          finding: "",
          action: "",
          comment: "",
          status: "pending",
          pictureURL: ""
        };
      }

    },
    onSavePicture: function (vnode) {
      processPicture(vnode.dom.querySelector("input").files[0]).then(function (value) {
        AuditItemsData.newpictureURL = value;
        console.log("new picture");
      });

    },
    onSaveAudit: function () {
      AuditItemsData.issaving = true;
      console.log('save audit');
      AuditItemsData.SaveAudit()
        .then(function (score) {
          M.toast({ html: 'Saved audit. Score: ' + score });
          AuditItemsData.issaving = false;
          AuditItemsData.isChanged = false;
          m.redraw();
        })
        .catch(function (error) {
          M.toast({ html: 'Error: ' + error });
          AuditItemsData.issaving = false;
          m.redraw();
        });
    },
    onSaveandLeave: function () {
      AuditItemsData.issaving = true;
      console.log('save audit');
      AuditItemsData.SaveAudit()
        .then(function (score) {
          M.toast({ html: 'Saved audit. Score: ' + score });
          AuditItemsData.issaving = false;
          AuditItemsData.isChanged = false;
          AuditItemsData.toScheduleScreen();
        })
        .catch(function (error) {
          M.toast({ html: 'Error: ' + error });
          AuditItemsData.issaving = false;
          m.redraw();
        });
    },
    SaveAudit: function () {
      return new Promise(function (resolve, reject) {
        let schedulekey = AuditItemsData.schedulekey;
        var nbitem = 0;
        var nbpass = 0;
        var nbna = 0;
        var score = {};
        Object.keys(AuditItemsData.audititems).forEach(function (itemkey) {
          let result = AuditItemsData.audititems[itemkey];
          // console.log(result);
          if (result > 0) {
            nbitem = nbitem + 1;
            nbpass = nbpass + 1;
          } else if (result == 0) {
            nbitem = nbitem + 1;
          } else if (result == -1) {
            nbna = nbna + 1;
          }
        });
        var batch = db.batch();
        var audititemsRef = db.collection("audititems").doc(schedulekey);
        batch.set(audititemsRef, AuditItemsData.audititems, { merge: true });
        var ncitemsRef = db.collection("ncitems").doc(schedulekey);
        batch.set(ncitemsRef, AuditItemsData.ncitems);
        var auditschedulesRef = db.collection("auditschedules").doc(schedulekey);
        batch.set(auditschedulesRef, {
          'passitem': nbpass,
          'totalitem': nbitem,
          'naitem': nbna,
          'score': Math.round(100 * nbpass / nbitem),
          'time': firebase.firestore.FieldValue.serverTimestamp(),
          'status': nbna == 0 ? 'done' : 'in-progress'
        }, { merge: true });
        batch.commit().then(function () {
          AllSchedulesData.data[schedulekey].status = (nbna == 0 ? 'done' : 'in-progress');
          AllSchedulesData.data[schedulekey].score = Math.round(100 * nbpass / nbitem);
          AllSchedulesData.data[schedulekey].passitem = nbpass;
          AllSchedulesData.data[schedulekey].totalitem = nbitem;
          return resolve(Math.round(100 * nbpass / nbitem));
        }).catch(function (error) {
          return reject(error);
        });
      });
    },
    onSaveNC: function (vnode) {
      AuditItemsData.isChanged = true;
      AuditItemsData.ncitems[AuditItemsData.itemkey] = AuditItemsData.currentnc;
      let finding = vnode.dom.querySelector("textarea").value;
      if (finding == "") {
        if (AuditItemsData.ncitems.hasOwnProperty(AuditItemsData.itemkey)) {
          //   if(AuditItemsData.ncitems[AuditItemsData.itemkey].pictureURL!=""){
          //    var storageRef = firebase.storage().ref();
          //    var desertRef = storageRef.child(AuditItemsData.schedulekey + "/" + AuditItemsData.itemkey + '.jpg');
          //   desertRef.delete().then(function () {
          //     console.log("deleted picture");
          //     M.toast({ html: 'Picture deleted' });
          //   }).catch(function (error) {
          //    console.log("delete picture error");
          //     console.log(error);
          //   });
          //  }
          delete AuditItemsData.ncitems[AuditItemsData.itemkey];
          M.toast({ html: 'NC deleted' });
          console.log("delete nc");
        }

      } else {
        AuditItemsData.ncitems[AuditItemsData.itemkey]['finding'] = finding;
        if (AuditItemsData.newpictureURL != "") {
          console.log("Upload picture");
          var storageRef = firebase.storage().ref();
          var imgref = storageRef.child(AuditItemsData.schedulekey + "/" + AuditItemsData.itemkey + '.jpg');
          var dataurl = dataURItoBlob(AuditItemsData.newpictureURL);
          var uploadTask = imgref.put(dataurl).then(function (snapshot) {
            imgref.getDownloadURL().then(function (url) {
              AuditItemsData.ncitems[AuditItemsData.itemkey]['pictureURL'] = url;
              console.log("Uploaded!");
              M.toast({ html: 'Picture uploaded!' });
            }).catch(function (error) {
              M.toast({ html: 'Error get picture link: ' + error });
            });
          }).catch(function (error) {
            M.toast({ html: 'Error upload picture: ' + error });
          });
        }



      }


    },
    onValueChange: function (vnode) {
      AuditItemsData.isChanged = true;
      let key = vnode.attrs.itemkey;
      let value = vnode.dom.querySelector('input[name="radio' + vnode.attrs.itemkey + '"]:checked').value;
      AuditItemsData.audititems[key] = Number(value);
    },

    onClickNC: function (vnode) {
      AuditItemsData.setCurrentNC(vnode.attrs.itemkey);
    },
    dataDownload: function () {
      exportAuditData(fbTimeToMMMYY(AllSchedulesData.data[AuditItemsData.schedulekey]["auditmonth"]), AuditItemsData.audititems, AuditItemsData.itemdata, AuditItemsData.ncitems);
    },
    setScheduleKey: function (schedulekey) {
      AuditItemsData.isChanged = false;
      AuditItemsData.schedulekey = schedulekey;
      AuditItemsData.cansave = AllSchedulesData.data[schedulekey].status == "completed" ? false : true;
      let auditsection = AllSchedulesData.data[schedulekey]["section"];
      let auditarea = AllSchedulesData.data[schedulekey]["area"];
      AuditItemsData.audititems = "none";
      AuditItemsData.ncitems = "none";
      AuditItemsData.itemdata = {};
      m.mount(root, AuditScreen);
      Promise.all([getDoc("audititems", schedulekey), getItemData(auditsection, auditarea)])
        .then(function (values) {
          AuditItemsData.audititems = {};
        //  AuditItemsData.audititems = values[0];
          AuditItemsData.itemdata = values[1];

          Object.keys(AuditItemsData.itemdata).forEach(function (itemkey) {
            if (values[0].hasOwnProperty(itemkey))
            AuditItemsData.audititems[itemkey] = values[0][itemkey];
          });

          //  console.log(AuditItemsData);
          m.redraw();
        }).catch(function (error) {
          M.toast({ html: 'Error: ' + error });
        });
      getDoc("ncitems", schedulekey)
        .then(function (value) {
          AuditItemsData.ncitems = {};
          Object.keys(value).forEach(function (itemkey) {
            if (value[itemkey].hasOwnProperty("finding"))
              AuditItemsData.ncitems[itemkey] = value[itemkey];
          });
          m.redraw();
        }).catch(function (error) {
          M.toast({ html: 'Error: ' + error });
        });
    }
  };
  const LoadingButton = {
    view: function (vnode) {
      return m("a.btn-flat.waves-effect.waves-teal.modal-trigger", { class: vnode.attrs.disabled ? vnode.attrs.classes + " disabled" : vnode.attrs.classes, href: vnode.attrs.href, onclick: vnode.attrs.onclick },
        [
          m("i.material-icons.right.accenttextcolor", { class: vnode.attrs.isloading ? "hide" : "" },
            "send"
          ),
          m(".preloader-wrapper.loadingbutton.right.active", { class: vnode.attrs.isloading ? "" : "hide" },
            m(".spinner-layer.spinner-green-only",
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
          ), "Submit"]
      )
    }
  };
  const HomeScreen = {
    view: function (vnode) {
      return m("div", [
        m(AppHeader),
        m(".has-fixed-sidenav",
          m(ScheduleContainer)),
        m(SubmitModal)
      ]);
    }
  };

  const ScheduleContainer = {
    view: function () {
      return m(".containerwithfixedheader",
        m(".container", AllSchedulesData.data == "none" ? m(Loading) :
          Object.keys(AllSchedulesData.data).map(function (schedulekey) {
            if (AllSchedulesData.data[schedulekey]["status"] != "completed" || (!AllSchedulesData.ispending))
              return m(ScheduleCard, { schedulekey: schedulekey, data: AllSchedulesData.data[schedulekey] });
          })
        ));
    }
  };
  const AppHeader = {
    oncreate: function (vnode) {
      //init ui
      M.Tabs.init(vnode.dom.querySelector(".tabs"));
      M.Sidenav.init(vnode.dom.querySelector(".sidenav"));
      M.Dropdown.init(vnode.dom.querySelector(".dropdown-trigger"));
    },
    view: function () {
      return m("div", [
        m("ul.dropdown-content[id='dropdown1']",
          [
            m("li",
              m("a",
                m("i.material-icons",
                  "account_circle"
                )
              )
            ),
            m("li.divider"),
            m("li",
              m("a", { onclick: Auth.signOut },
                "Sign out"
              )
            )
          ]
        ),
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
        m(".navbar-fixed",
          m("nav.nav-extended.primarycolor.has-fixed-sidenav",
            [
              m(".nav-wrapper",
                [
                  m("a.brand-logo.center[href='#']",
                    "Schedule"
                  ),
                  m("a.sidenav-trigger[data-target='slide-out'][href='#']",
                    m("i.material-icons",
                      "menu"
                    )
                  )
                  ,
                m("ul.right.",
                  m("li",
                    m("a.dropdown-trigger[data-target='dropdown1'][href='#!']",
                      m("i.material-icons",
                        "account_circle"
                      )
                    )
                  )
                )
                ]
              ),
              m(".nav-content",
                m("ul.tabs.tabs-transparent.tabs-fixed-width",
                  [
                    m("li.tab",
                      m("a[href='#tabPendingSchedules']", { onclick: function () { AllSchedulesData.ispending = true; } },
                        "Pending"
                      )
                    ),
                    m("li.tab",
                      m("a[href='#tabAllSchedules']", { onclick: function () { AllSchedulesData.ispending = false; } },
                        "All"
                      )
                    )
                  ]
                )
              )
            ]
          ))
      ])
        ;
    }
  };
  const SubmitModal = {
    oncreate: function (vnode) {
      let elem = document.querySelector('.modal');
      M.Modal.init(elem, { dismissible: false });
    },
    view: function (vnode) {
      return m(".modal[id='submitmodal']",
        [
          m(".modal-content",
            m("p",
              "Do you want to submit"
            )
          ),
          m(".modal-footer",
            [m("a.modal-close.waves-effect.waves-green.btn-flat[href='#!']", { onclick: AllSchedulesData.submit },
              "YES"
            ),
            m("a.modal-close.waves-effect.waves-red.btn-flat[href='#!']", { onclick: AllSchedulesData.notSubmit },
              "NO"
            )]
          )
        ]
      )
    }
  };
  const SaveAuditModal = {
    oncreate: function (vnode) {
      let elem = document.querySelector('#saveAuditModal');
      M.Modal.init(elem, { dismissible: true });
    },
    view: function (vnode) {
      return m(".modal[id='saveAuditModal']",
        [
          m(".modal-content",
            m("p",
              "You've not save your audit, do you want to save before you leave?"
            )
          ),
          m(".modal-footer",
            [m("a.modal-close.waves-effect.waves-green.btn-flat[href='#!']", { onclick: AuditItemsData.onSaveandLeave },
              "YES"
            ),
            m("a.modal-close.waves-effect.waves-red.btn-flat[href='#!']", { onclick: AuditItemsData.toScheduleScreen },
              "NO"
            )]
          )
        ]
      )
    }
  };
  const ScheduleCard = {
    view: function (vnode) {
      return m(".card.row",
        [
          m(".card-content.row",
            [
              m("span.left",
                [
                  m("p.secondarytextcolor",
                    fbTimeToMMYYYY(vnode.attrs.data["auditmonth"])
                  ),
                  m("p.text20.primarytextcolor",
                    vnode.attrs.data["section"] + '-' + vnode.attrs.data["area"]
                  ),
                  m("p",
                    vnode.attrs.data["auditor1"]
                  ),
                  m("p",
                    vnode.attrs.data["auditor2"]
                  )
                ]
              ),
              m("span.right",
                [
                  m("p.text56.primarytextcolor.center",
                    vnode.attrs.data["score"]
                  ),
                  m("p.center.uppercase",
                    vnode.attrs.data["status"]
                  )
                ]
              )
            ]
          ),
          m(".divider"),
          m(".right",
            [
              m(LoadingButton, { disabled: AllSchedulesData.schedulekey != "", isloading: vnode.attrs.schedulekey == AllSchedulesData.schedulekey, classes: vnode.attrs.data["status"] == "done" ? "" : "hide", href: '#submitmodal', onclick: AllSchedulesData.prepareSubmit.bind(this, vnode.attrs.schedulekey) }),

              m("a.waves-effect.waves-teal.btn-flat", { onclick: AuditItemsData.setScheduleKey.bind(this, vnode.attrs.schedulekey) },
                [
                  m("i.material-icons.right.accenttextcolor",
                    "check"
                  ),
                  "Audit"
                ]
              )
            ]
          )
        ]

      );
    }
  };
  const AuditHeader = {
    oninit: function () {
      AllSchedulesData.ispending = true;
    },
    oncreate: function (vnode) {
      M.Tabs.init(vnode.dom.querySelector(".tabs"));
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
        m(".navbar-fixed",
          m("nav.nav-extended.primarycolor.has-fixed-sidenav",
            [
              m(".nav-wrapper",
                [
                  m("a.brand-logo.center[href='#']",
                    "Audit"
                  ),
                  m("a.left.headerbutton.show-on-large[href='#']", { onclick: AuditItemsData.checkSaveandLeave },
                    m("i.material-icons",
                      "arrow_back"
                    )
                  ),
                  m("a.right.headerbutton.[href='#']", { onclick: AuditItemsData.dataDownload },
                    m("i.material-icons",
                      "file_download"
                    )
                  ),
                  m("a.right.headerbutton.[href='#']", { onclick: AuditItemsData.onSaveAudit, class: (AuditItemsData.cansave && (!AuditItemsData.issaving)) ? "" : "hide" },
                    m("i.material-icons",
                      "save"
                    )
                  ),
                  m(".right.preloader-wrapper.headerloading.tiny.active", { class: AuditItemsData.issaving ? "" : "hide" },
                    m(".spinner-layer.spinner-green-only",
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
                  )
                ]
              ),
              m(".nav-content",
                m("ul.tabs.tabs-transparent.tabs-fixed-width",
                  [
                    m("li.tab",
                      m("a[href='#tabAuditItems']",
                        "Audit"
                      )
                    ),
                    m("li.tab",
                      m("a[href='#tabNCItems']",
                        "NC"
                      )
                    )
                  ]
                )
              )
            ]
          ))
      ]);
    }
  };
  const AuditItemContainer = {
    view: function (vnode) {
      return m(".containerwithfixedheader", [
        m(".container[id='tabAuditItems']",
          AuditItemsData.audititems == "none" ? m(Loading) :
            Object.keys(AuditItemsData.audititems).map(function (itemkey) {
              return m(AuditItemCard, { onClickNC: AuditItemsData.onClickNC, onValueChange: AuditItemsData.onValueChange, itemkey: itemkey, itemdata: AuditItemsData.itemdata[itemkey], value: AuditItemsData.audititems[itemkey] });
            })),
        m(".container[id='tabNCItems']",
          AuditItemsData.ncitems == "none" ? m(Loading) :
            Object.keys(AuditItemsData.ncitems).map(function (itemkey) {
              return m(NCItemCard, { itemkey: itemkey, ncitems: AuditItemsData.ncitems[itemkey] });
            })
        )
      ]);
    }
  };
  const NCItemCard = {
    view: function (vnode) {
      return m(".card.row",
        m(".card-content",
          [
            m("span.primarytextcolor.textbold", vnode.attrs.ncitems.itemarea),
            m("span.right.secondarytextcolor", vnode.attrs.itemkey),
            m("p", vnode.attrs.ncitems.itemtext),
            m("p.textitalic", vnode.attrs.ncitems.itemcriteria),
            m(".imagepanel", { class: vnode.attrs.ncitems.pictureURL == "" ? "hide" : "" },
              m("img[height='auto'][width='100%'][id='inputpicture']", { src: vnode.attrs.ncitems.pictureURL })
            ),
            m("p.text12.upperheader.secondarytextcolor", "Finding:"),
            m("p", vnode.attrs.ncitems.finding)
          ]
        )
      )
    }
  };
  const NCModal = {
    onupdate: function (vnode) {
      M.updateTextFields(vnode.dom);
    },
    oncreate: function (vnode) {
      let elem = document.querySelector('.modal');
      M.Modal.init(elem);
    },
    view: function (vnode) {
      return m(".modal[id='modal1']",
        [
          m(".modal-content",
            [
              m("h4.col.s12.accenttextcolor",
                "Non-conforming"
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
                  )
                ]),
              m("div.file-field.input-field",
                [
                  m("a.waves-effect.waves-teal.btn-flat", { class: AuditItemsData.cansave ? "" : "hide" },
                    [
                      m("i.material-icons.left",
                        "add_a_photo"
                      ),
                      m("span",
                        "Take a picture"
                      ),
                      m("input[accept='image/*'][id='file-input'][type='file']", { onchange: vnode.attrs.onSavePicture.bind(this, vnode) }
                      )
                    ]
                  ),
                  m(".file-path-wrapper.hide",
                    m("input.file-path.validate[type='text']")
                  )
                ]
              ),
              m(".imagepanel", { class: vnode.attrs.data.pictureURL == "" ? "hide" : "" },
                m("img[height='auto'][width='100%'][id='inputpicture']", { src: vnode.attrs.data.pictureURL })
              ),

              m(".input-field",
                [
                  m("textarea.materialize-textarea[id='textareamodal1']", { value: vnode.attrs.data.finding }),
                  m("label[for='textareamodal1']",
                    'Finding'
                  )
                ]
              )
            ]
          ),
          m(".modal-footer",
            [
              m("a.modal-close.waves-effect.waves-green.btn-flat[href='#!']", { class: vnode.attrs.cansave ? "" : "hide", onclick: vnode.attrs.onSaveNC.bind(this, vnode) },
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
  const AuditItemCard = {
    view: function (vnode) {
      return m(".card.row",
        [
          m(".card-content",
            [
              m("span.primarytextcolor.textbold", vnode.attrs.itemdata.itemarea),
              m("span.right.secondarytextcolor", vnode.attrs.itemkey),
              m("p", vnode.attrs.itemdata.itemtext),
              m("p.textitalic", vnode.attrs.itemdata.itemcriteria),

              m("div", AuditItemsData.ncitems.hasOwnProperty(vnode.attrs.itemkey) ? [
                m("p.text12.upperheader.secondarytextcolor", "Finding:"),
                m("p", AuditItemsData.ncitems[vnode.attrs.itemkey]["finding"])
              ] : "")
            ]
          ),
          m(".divider"),
          m(".mycheckcontainer",
            [
              m("a.col.btn-flat.modal-trigger.waves-effect.waves-teal[href='#modal1']", { onclick: vnode.attrs.onClickNC.bind(this, vnode) },
                [
                  m("i.material-icons.left",
                    "create"
                  ),
                  "Non-conforming"
                ]
              ),
              m(".col.right",
                [
                  m(".radio-item.optionc",
                    [
                      m("input[radiovaluec=''][type='radio'][value=-1]",
                        {
                          id: 'cradio' + vnode.attrs.itemkey, name: 'radio' + vnode.attrs.itemkey, checked: vnode.attrs.value == -1 ? true : false,
                          onclick: vnode.attrs.onValueChange.bind(this, vnode)
                        }),
                      m("label", { for: 'cradio' + vnode.attrs.itemkey })
                    ]
                  ),
                  m(".radio-item.optionb",
                    [
                      m("input[radiovalueb=''][type='radio'][value=0]",
                        {
                          id: 'bradio' + vnode.attrs.itemkey, name: 'radio' + vnode.attrs.itemkey, checked: vnode.attrs.value == 0 ? true : false,
                          onclick: vnode.attrs.onValueChange.bind(this, vnode)
                        }),
                      m("label", { for: 'bradio' + vnode.attrs.itemkey })
                    ]
                  ),
                  m(".radio-item.optiona",
                    [
                      m("input[radiovaluea=''][type='radio'][value=10]",
                        {
                          id: 'aradio' + vnode.attrs.itemkey, name: 'radio' + vnode.attrs.itemkey, checked: vnode.attrs.value == 10 ? true : false,
                          onclick: vnode.attrs.onValueChange.bind(this, vnode)
                        }),
                      m("label", { for: 'aradio' + vnode.attrs.itemkey })
                    ]
                  )
                ]
              )
            ]
          )
        ]
      );

    }
  };
  const AuditScreen = {
    view: function (vnode) {
      return m("div", [
        m(AuditHeader),
        m(".has-fixed-sidenav", m(AuditItemContainer)),
        m(NCModal, { cansave: AuditItemsData.cansave, data: AuditItemsData.currentnc, onSaveNC: AuditItemsData.onSaveNC, onSavePicture: AuditItemsData.onSavePicture }),
        m(SaveAuditModal)
      ]);
    }
  };
  const Loading = {
    view: function (vnode) {
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


  //-------------------------------------------------
  function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
    else
      byteString = unescape(dataURI.split(',')[1]);
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
  }
  function processPicture(file) {
    return new Promise(function (resolve, reject) {
      //  var file = e.target.files[0];
      // Create an image
      var img = document.createElement("img");
      //  var img=document.getElementById('mypicture');
      // Create a file reader
      var reader = new FileReader();
      // Set the image once loaded into file reader
      reader.onload = function (e) {
        img.src = e.target.result;
        img.addEventListener('load', function () {
          var canvas = document.createElement("canvas");
          //var canvas = $("<canvas>", {"id":"testing"})[0];
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          var MAX_WIDTH = 400;
          var MAX_HEIGHT = 300;
          var width = img.width;
          var height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          var imgurl = canvas.toDataURL("image/png");
          // document.getElementById('mypicture').classList.remove("hide");
          // this.pictureURL = imgurl;
          // Convert Base64 image to binary
          //  dataurl = dataURItoBlob(imgurl);
          document.getElementById('inputpicture').src = imgurl;
          document.querySelector('.imagepanel').classList.remove("hide");
          //  console.log("inserted piture" + imgurl);
          // m.redraw();
          return resolve(imgurl);
        });

      }
      reader.readAsDataURL(file);
    });
  }
  //----------------------Firebase user event-----------------------------   
  firebase.auth().onAuthStateChanged(function (firebaseUser) {
    if (firebaseUser) {
      Auth.setUser(firebaseUser);
      console.log('logged in');
      if (firebaseUser.emailVerified) {
        console.log('verified');
        AllSchedulesData.oninit();
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