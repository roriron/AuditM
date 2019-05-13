(function () {
  'use strict';
  const root = document.querySelector(".main");
  //--------Data-------------------------------------
  const Auth = {
    user: null,
    setUser: function (user) {
      Auth.user = user;
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
    isTechnologist: function () {
      if (Auth.user) {
        if (Auth.user.displayName.split("-")[1] != "NA")
          return true;
        else
          return false;
      }
      else
        return false;
    },
    isAdmin: function () {
      if (Auth.user) {
        if (Auth.user.displayName.split("-")[2] == "ADMIN")
          return true;
        else
          return false;
      }
      else
        return false;
    },
    getEmail: function () {
      if (Auth.user) {
        return Auth.user.email.split("@")[0];
      }
      else
        return "";
    }
  };
  const AllEmailData = {
    data: [],
    header: ['email', 'verified', 'section', 'role', 'admin', 'creation', 'last', 'change'],
    issaving: false,
    worksheet: function () {
      return XLSX.utils.json_to_sheet(AllEmailData.data)
    },
    loadData: function () {
      var getallusers = firebase.functions().httpsCallable('getAllUsers');
      getallusers({}).then(function (result) {
        AllEmailData.data = [];
        console.log(result);
        // Read result of the Cloud Function.
        result.data.forEach(function (user) {
          console.log(user);
          AllEmailData.data.push({
            email: user.email,
            verified: user.emailVerified,
            section: user.displayName.split("-")[0],
            role: user.displayName.split("-")[1],
            admin: user.displayName.split("-")[2],
            creation: user.metadata.creationTime,
            last: user.metadata.lastSignInTime,
            change: ""
          });
        });
        m.redraw();
        //let worksheet = XLSX.utils.json_to_sheet(users);
      });
    },
    download: function (vnode) {
      let workbook = XLSX.utils.table_to_book(vnode.dom.querySelector("table"));
      XLSX.writeFile(workbook, 'data.xlsx');
    },
    onchange: function (files) {
      let rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
      let f = files[0];
      let reader = new FileReader();
      reader.onload = function (e) {
        AllEmailData.data = [];
        let data = e.target.result;
        if (!rABS) data = new Uint8Array(data);
        let workbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' });
        AllEmailData.data = XLSX.utils.sheet_to_json(workbook.Sheets["Sheet1"]);
        m.redraw();
      };
      if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
    },
    saveData: function () {
      AllEmailData.data.forEach(function (user) {
        if (user.change) {
          console.log(user.change + " " + user.email);
          let updateUser = firebase.functions().httpsCallable('updateUser');
          updateUser({
            email: user.email,
            displayName: user.section + '-' + user.role + '-' + user.admin,
            change: user.change
          }).then(function (result) {
            console.log(result);
            M.toast({ html: 'Saved user information!' });
          });
        }
      });
    }
  };
  const AllScheduleData = {
    data: [],
    header: ['id', 'section', 'area', 'month', 'auditor 1', 'auditor 2', 'status', 'score',
      'target', 'total item', 'pass item', 'na item', 'last save', 'change'],
    issaving: false,
    worksheet: function () {
      return XLSX.utils.json_to_sheet(AllScheduleData.data)
    },
    loadData: function () {
      AllScheduleData.data = [];
      db.collection("auditschedules")
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            let schedule = {};
            schedule["id"] = doc.id;
            schedule["section"] = doc.data()["section"];
            schedule["area"] = doc.data()["area"];
            schedule["month"] = fbTimeToDDMMMYYYY(doc.data()["auditmonth"]);
            schedule["auditor 1"] = doc.data()["auditor1"];
            schedule["auditor 2"] = doc.data()["auditor2"];
            schedule["status"] = doc.data()["status"];
            schedule["score"] = doc.data()["score"];
            schedule["target"] = doc.data()["target"];
            schedule["total item"] = doc.data()["totalitem"];
            schedule["pass item"] = doc.data()["passitem"];
            schedule["na item"] = doc.data()["naitem"];
            schedule["last save"] = fbTimeToDDMMMYYYY(doc.data()["time"]);
            schedule["change"] = "";
            AllScheduleData.data.push(schedule);
            // console.log(schedule);
          });
          m.redraw();
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    download: function (vnode) {
      let workbook = XLSX.utils.table_to_book(vnode.dom.querySelector("table"));
      XLSX.writeFile(workbook, 'data.xlsx');
    },
    onchange: function (files) {
      let rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
      let f = files[0];
      let reader = new FileReader();
      reader.onload = function (e) {
        AllScheduleData.data = [];
        let data = e.target.result;
        if (!rABS) data = new Uint8Array(data);
        let workbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' });
        AllScheduleData.data = XLSX.utils.sheet_to_json(workbook.Sheets["Sheet1"],{raw:true});
        m.redraw();
      };
      if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
    },
    saveData: function () {
      AllScheduleData.data.forEach(function (row) {
        if (row.change == "update") {
          let datatoupdate = {};
          if (row.hasOwnProperty('section')) datatoupdate['section'] = row["section"];
          if (row.hasOwnProperty('area')) datatoupdate['area'] = row["area"];
          if (row.hasOwnProperty('month')) datatoupdate['auditmonth'] = new Date(row["month"]);
          if (row.hasOwnProperty('auditor 1')) datatoupdate['auditor1'] = row["auditor 1"];
          if (row.hasOwnProperty('auditor 2')) datatoupdate['auditor2'] = row["auditor 2"];
          if (row.hasOwnProperty('status')) datatoupdate['status'] = row["status"];
          if (row.hasOwnProperty('target')) datatoupdate['target'] =Number(row["target"]);
          if (row.hasOwnProperty('score')) datatoupdate['score'] = Number(row["score"]);
          if (row.hasOwnProperty('total item')) datatoupdate['totalitem'] =Number( row["total item"]);
          if (row.hasOwnProperty('pass item')) datatoupdate['passitem'] = Number(row["pass item"]);
          if (row.hasOwnProperty('na item')) datatoupdate['naitem'] = Number(row["na item"]);
         // console.log(datatoupdate);
          db.collection("auditschedules").doc(row["id"])
            .set(datatoupdate, { merge: true })
            .then(function (data) {
              M.toast({ html: 'Saved schedule information!' });
            }).catch(function (error) {
              console.log(error);
            });
        } else if (row.change == "delete") {
          db.collection("auditschedules").doc(row["id"])
            .delete()
            .then(function () {
              M.toast({ html: 'Deleted schedule!' });
            }).catch(function (error) {
              console.log(error);
            });
        }
      });
    }
  };
  const AllNCData = {
    data: [],
    header: ['auditId','questionId', 'section', 'area', 'itemarea', 'itemtext', 'itemcriteria', 'finding','deadline', 'action',
      'actionby', 'actiontime', 'comment', 'commentby', 'commenttime','status'],
    issaving: false,
    worksheet: function () {
      return XLSX.utils.json_to_sheet(AllNCData.data)
    },
    loadData: function () {
      AllNCData.data = [];
      db.collection("ncitems")
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            let itemdata=doc.data();
            Object.keys(itemdata).forEach(function (itemkey) {
              if(itemdata[itemkey].hasOwnProperty("finding")){
                itemdata[itemkey]["questionId"] = itemkey;
                itemdata[itemkey]["auditId"] = doc.id;
                itemdata[itemkey]["area"] = itemdata["area"];
                itemdata[itemkey]["section"] = itemdata["section"];

                if(itemdata[itemkey].hasOwnProperty("deadline"))  itemdata[itemkey]["deadline"]=fbTimeToDDMMMYYYY(itemdata[itemkey]["deadline"]);
                if(itemdata[itemkey].hasOwnProperty("actiontime"))  itemdata[itemkey]["actiontime"]=fbTimeToDDMMMYYYY(itemdata[itemkey]["actiontime"]);
                if(itemdata[itemkey].hasOwnProperty("commenttime"))  itemdata[itemkey]["commenttime"]=fbTimeToDDMMMYYYY(itemdata[itemkey]["commenttime"]);
                //  console.log(itemkey);
                AllNCData.data.push(itemdata[itemkey]);
              }
              
            });
            // console.log(AllNCData.data);
          });
          m.redraw();
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    download: function (vnode) {
      let workbook = XLSX.utils.table_to_book(vnode.dom.querySelector("table"));
      XLSX.writeFile(workbook, 'data.xlsx');
    },
  
  };
  const AllResultData = {
    data: [],
    header: ['id', 'itemarea', 'itemtext', 'itemcriteria', 'result'],
    issaving: false,
    worksheet: function () {
      return XLSX.utils.json_to_sheet(AllResultData.data)
    },
    loadData: function (vnode) {
      let scheduleid = vnode.dom.querySelector('select').value;
      console.log(scheduleid);
      let schedule = AllScheduleData.data.find(function (item) { return item["id"] == scheduleid });
      console.log(schedule);
      AllResultData.data = [];
      db.collection("appdata").where("area", "==", schedule["area"]).where("section", "==", schedule["section"]).limit(1)
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            let itemdata = doc.data();
            // console.log(itemdata);
            Object.keys(itemdata).forEach(function (itemkey) {
              if(itemdata[itemkey].hasOwnProperty("itemarea")){
                itemdata[itemkey]["id"] = itemkey;
                //  console.log(itemkey);
                AllResultData.data.push(itemdata[itemkey]);
              }
              
            });
          });
          db.collection('audititems').doc(scheduleid)
            .get()
            .then(function (doc) {
              if (doc.exists) {
                let results = doc.data();
                Object.keys(results).forEach(function (itemkey) {
                  //  if(itemkey.hasOwnProperty)
                  let itemdata = AllResultData.data.find(function (item) { return item["id"] == itemkey; });
                  // console.log(itemdata);
                  if (itemdata != undefined) {
                    itemdata["result"] = results[itemkey];
                  }
                });
                m.redraw();
              }
            }).catch(function (error) {
              console.log(error);
              M.toast({ html: error });
            });

        }).catch(function (error) {
          console.log(error);
          M.toast({ html: error });
        });
    },
    download: function (vnode) {
      let workbook = XLSX.utils.table_to_book(vnode.dom.querySelector("table"));
      XLSX.writeFile(workbook, 'data.xlsx');
    },
    onchange: function (files) {
      let rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
      let f = files[0];
      let reader = new FileReader();
      reader.onload = function (e) {
        AllResultData.data = [];
        let data = e.target.result;
        if (!rABS) data = new Uint8Array(data);
        let workbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' });
        AllResultData.data = XLSX.utils.sheet_to_json(workbook.Sheets["Sheet1"]);
        m.redraw();
      };
      if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
    },
    saveData: function (vnode) {
      let datatosave = {};
      let scheduleid = vnode.dom.querySelector('select').value;
      AllResultData.data.forEach(function (row) {
        if (row.hasOwnProperty("result")) datatosave[row.id] = Number(row.result);
      });
      console.log(datatosave);
      db.collection("audititems").doc(scheduleid)
        .set(datatosave)
        .then(function () {
          M.toast({ html: 'Saved data information!' });
        }).catch(function (error) {
          M.toast({ html: error });
          console.log(error);
        });
    }
  };
  const HomeScreen = {

    view: function (vnode) {
      return m("div", [
        m(AppHeader),
        m(".has-fixed-sidenav",[
        m(TabEmail),
        m(TabSchedule),
        m(TabResult),
        m(TabNC)])
      ]);
    }
  };
  const LoadingButton = {
    view: function (vnode) {
      return m("a.btn.waves-effect.waves-teal", { class: vnode.attrs.disabled ? vnode.attrs.classes + " disabled" : vnode.attrs.classes, href: vnode.attrs.href, onclick: vnode.attrs.onclick },
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
          ), "Save"]
      )
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
        m(".navbar-fixed",
        m("nav.nav-extended.primarycolor.has-fixed-sidenav",
          [
            m(".nav-wrapper",
              [
                m("a.brand-logo.center[href='#']",
                  "Report"
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
                    m("a[href='#tabschedule']",
                      "Schedule"
                    )
                  ),
                  m("li.tab",
                    m("a[href='#tabresult']",
                      "Result"
                    )
                  ),
                  m("li.tab",
                    m("a[href='#tabemail']",
                      "User"
                    )
                  ),
                  m("li.tab",
                  m("a[href='#tabnc']",
                    "Action"
                  )
                )
                ]
              )
            )
          ]
        ))
      ]
      )
        ;
    }
  };
  const TabEmail = {
    view: function (vnode) {
      return m("div[id='tabemail'].containerwithfixedheader",
      m(".container",
        [
          m("a.waves-effect.waves-light.btn-flat", { onclick: AllEmailData.loadData },
            [
              m("i.material-icons.left",
                "loop"
              ),
              "Load users"
            ]
          ),
          m("a.waves-effect.waves-light.btn-flat.right", { onclick: AllEmailData.download.bind(this, vnode) },
            [
              m("i.material-icons.left",
                "file_download"
              ),
              "Download"
            ]
          ),
          m("table.striped.highlight",
            [
              m("thead",
                m("tr",
                  AllEmailData.header.map(function (title) {
                    return m("th", title);
                  })
                )
              ),
              m("tbody",
                AllEmailData.data.map(function (item) {
                  return m("tr",
                    AllEmailData.header.map(function (title) {
                      return m("td", item[title]);
                    })
                  );
                })
              )
            ]
          ),
          m(".section"),
          m("div", { class: Auth.isAdmin ? "" : "hide" },
            [
              m(".file-field.input-field",
                [
                  m(".btn",
                    [
                      m("span",
                        "File"
                      ),
                      m("input[type='file']", { onchange: m.withAttr("files", AllEmailData.onchange) })
                    ]
                  ),
                  m(".file-path-wrapper",
                    m("input.file-path.validate[placeholder='Click here to upload a file'][type='text']"
                      //  {change:m.withAttr("files", AllEmailData.onchange)})

                    ))
                ]
              ),
              m("div",
                m(LoadingButton, { onclick: AllEmailData.saveData })
              )
            ]
          )
        ]
      ));
    }
  };
  const TabSchedule = {
    view: function (vnode) {
      return m("div[id='tabschedule'].containerwithfixedheader",
      m(".container",
        [
          m("a.waves-effect.waves-light.btn-flat", { onclick: AllScheduleData.loadData },
            [
              m("i.material-icons.left",
                "loop"
              ),
              "Load schedules"
            ]
          ),
          m("a.waves-effect.waves-light.btn-flat.right", { onclick: AllScheduleData.download.bind(this, vnode) },
            [
              m("i.material-icons.left",
                "file_download"
              ),
              "Download"
            ]
          ),
          m("table.striped.highlight",
            [
              m("thead",
                m("tr",
                  AllScheduleData.header.map(function (title) {
                    return m("th", title);
                  })
                )
              ),
              m("tbody",
                AllScheduleData.data.map(function (item) {
                  return m("tr",
                    AllScheduleData.header.map(function (title) {
                      return m("td", item[title]);
                    })
                  );
                })
              )
            ]
          ),
          m(".section"),
          m("div", { class: Auth.isAdmin ? "" : "hide" },
            [
              m(".file-field.input-field",
                [
                  m(".btn",
                    [
                      m("span",
                        "File"
                      ),
                      m("input[type='file']", { onchange: m.withAttr("files", AllScheduleData.onchange) })
                    ]
                  ),
                  m(".file-path-wrapper",
                    m("input.file-path.validate[placeholder='Click here to upload a file'][type='text']"
                      //  {change:m.withAttr("files", AllEmailData.onchange)})

                    ))
                ]
              ),
              m("div",
                m(LoadingButton, { onclick: AllScheduleData.saveData })
              )
            ]
          )
        ])
      );
    }
  };
  const TabResult = {
    onupdate: function (vnode) {
      M.FormSelect.init(vnode.dom.querySelector('select'));
    },
    view: function (vnode) {
      return m("div[id='tabresult'].containerwithfixedheader",
      m(".container",
        [
          m(".row", [
            m(".input-field.col.s6",
              [
                m("select",
                  [
                    m("option[disabled=''][selected=''][value='']",
                      "Choose schedule"
                    ),
                    AllScheduleData.data.map(function (item) {
                      return m("option", { value: item['id'] }, item['id']);
                    })
                  ]
                ),
                m("label",
                  "Select schedule id"
                )
              ]
            ),
            m("a.waves-effect.waves-light.btn-flat", { onclick: AllResultData.loadData.bind(this, vnode) },
              [
                m("i.material-icons.left",
                  "loop"
                ),
                "Load results"
              ]
            ),
            m("a.waves-effect.waves-light.btn-flat.right", { onclick: AllResultData.download.bind(this, vnode) },
              [
                m("i.material-icons.left",
                  "file_download"
                ),
                "Download"
              ]
            )
          ]),
          m("table.striped.highlight",
            [
              m("thead",
                m("tr",
                  AllResultData.header.map(function (title) {
                    return m("th", title);
                  })
                )
              ),
              m("tbody",
                AllResultData.data.map(function (item) {
                  return m("tr",
                    AllResultData.header.map(function (title) {
                      return m("td", item[title]);
                    })
                  );
                })
              )
            ]
          ),
          m(".section"),
          m("div", { class: Auth.isAdmin ? "" : "hide" },
            [
              m(".file-field.input-field",
                [
                  m(".btn",
                    [
                      m("span",
                        "File"
                      ),
                      m("input[type='file']", { onchange: m.withAttr("files", AllResultData.onchange) })
                    ]
                  ),
                  m(".file-path-wrapper",
                    m("input.file-path.validate[placeholder='Click here to upload a file'][type='text']"
                      //  {change:m.withAttr("files", AllEmailData.onchange)})

                    ))
                ]
              ),
              m("div",
                m(LoadingButton, { onclick: AllResultData.saveData.bind(this, vnode) })
              )
            ]
          )
        ])
      );
    }
  };
  const TabNC = {
    view: function (vnode) {
      return m("div[id='tabnc'].containerwithfixedheader",
      m(".container",
        [
          m("a.waves-effect.waves-light.btn-flat", { onclick: AllNCData.loadData },
            [
              m("i.material-icons.left",
                "loop"
              ),
              "Load schedules"
            ]
          ),
          m("a.waves-effect.waves-light.btn-flat.right", { onclick: AllNCData.download.bind(this, vnode) },
            [
              m("i.material-icons.left",
                "file_download"
              ),
              "Download"
            ]
          ),
          m("table.striped.highlight",
            [
              m("thead",
                m("tr",
                AllNCData.header.map(function (title) {
                    return m("th", title);
                  })
                )
              ),
              m("tbody",
              AllNCData.data.map(function (item) {
                  return m("tr",
                  AllNCData.header.map(function (title) {
                      return m("td", item[title]);
                    })
                  );
                })
              )
            ]
          ),
          m(".section")
        ])
      );
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
            console.log(doc);
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
        //  AllActionData.oninit();
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