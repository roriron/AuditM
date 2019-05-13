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
    getEmail: function () {
      if (Auth.user) {
        return Auth.user.email.split("@")[0];
      }
      else
        return "";
    }
  };
  const AuditResultData = {
    data: {},
    area: {},
    oninit: function () {
      AuditResultData.data = {};
      db.collection("auditresults").doc("result")
        .get()
        .then(function (doc) {
          if (doc.exists) {
            let sum = {};
            let count = {};
            let sumtarget = {};
            let counttarget = {};
            let countnc = {};
            let countpending = {};
            let alldata = [];
            Object.keys(doc.data()).forEach(function (schedulekey) {
              alldata.push(doc.data()[schedulekey]);
            });
            alldata.sort(function (a, b) {
              return a.auditmonth.seconds - b.auditmonth.seconds;
            });
            alldata.forEach(function (result) {
              let monthyear = fbTimeToMMMYY(result.auditmonth);
              let section = result.section;
              let area = result.area;
              if (!sum.hasOwnProperty(section)) {
                sum[section] = {};
                count[section] = {};
                sumtarget[section] = {};
                counttarget[section] = {};
                countnc[section] = 0;
                countpending[section] = 0;
                AuditResultData.area[section] = [];
              }
              if (!sum.hasOwnProperty(area)) {
                sum[area] = {};
                count[area] = {};
                sumtarget[area] = {};
                counttarget[area] = {};
                countnc[area] = 0;
                countpending[area] = 0;
              }
              if (AuditResultData.area[section].indexOf(area) < 0) AuditResultData.area[section].push(area);
              if (!sum[area].hasOwnProperty(monthyear)) {
                sum[area][monthyear] = 0;
                count[area][monthyear] = 0;
                sumtarget[area][monthyear] = 0;
                counttarget[area][monthyear] = 0;
              }
              if (!sum[section].hasOwnProperty(monthyear)) {
                sum[section][monthyear] = 0;
                count[section][monthyear] = 0;
                sumtarget[section][monthyear] = 0;
                counttarget[section][monthyear] = 0;
              }
              sum[area][monthyear] += result.score;
              count[area][monthyear] += 1;
              sumtarget[area][monthyear] += result.target;
              counttarget[area][monthyear] += 1;
              countnc[area] += result.nc;
              countpending[area] += result.pending;

              sum[section][monthyear] += result.score;
              count[section][monthyear] += 1;
              sumtarget[section][monthyear] += result.target;
              counttarget[section][monthyear] += 1;
              countnc[section] += result.nc;
              countpending[section] += result.pending;
            });
            Object.keys(sum).forEach(function (area) {
              AuditResultData.data[area] = {};
              AuditResultData.data[area]['label'] = [];
              AuditResultData.data[area]['score'] = [];
              AuditResultData.data[area]['target'] = [];
              AuditResultData.data[area]['nc'] = countnc[area];
              AuditResultData.data[area]['pending'] = countpending[area];
              Object.keys(sum[area]).forEach(function (monthyear) {
                AuditResultData.data[area]['label'].push(monthyear);
                AuditResultData.data[area]['score'].push(Math.round(sum[area][monthyear] / count[area][monthyear]));
                AuditResultData.data[area]['target'].push(Math.round(sumtarget[area][monthyear] / counttarget[area][monthyear]));

              });
            });
          }
          m.redraw();
        }).catch(function (error) {
          console.log("Error getting documents: ", error);
          M.toast({ html: 'Error getting nc items: ' + error });
        });
    }

  };
  const ScheduleData = {
    data: {},
    currentarea: "",
    currentsection:"",
    setArea: function (area) {
      ScheduleData.currentsection="";
      if (ScheduleData.currentarea == area) return;
      ScheduleData.currentarea = area;
      ScheduleData.data = {};
      db.collection("auditschedules").where("area", "==", area)
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            ScheduleData.data[doc.id] = {};
            ScheduleData.data[doc.id] = doc.data();
          });
          m.redraw();
        }).catch(function (error) {
          console.log("Error getting documents: ", error);
        });
    },
    setSection: function (section) {
      ScheduleData.currentarea="";
      if (ScheduleData.currentsection == section) return;
      ScheduleData.currentsection = section;
      ScheduleData.data = {};
      db.collection("auditschedules").where("section", "==", section)
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            ScheduleData.data[doc.id] = {};
            ScheduleData.data[doc.id] = doc.data();
          });

          m.redraw();
        }).catch(function (error) {
          console.log("Error getting documents: ", error);
        });
    }
  };
  const AuditItemsData = {
    audititems: {},//result
    itemdata: {},//text data
    ncitems: {},
    setScheduleKey: function (schedulekey) {
      let auditsection = ScheduleData.data[schedulekey]["section"];
      let auditarea = ScheduleData.data[schedulekey]["area"];
      AuditItemsData.audititems = {};
      AuditItemsData.ncitems = {};
      AuditItemsData.itemdata = {};
      Promise.all([getDoc("audititems", schedulekey), getItemData(auditsection, auditarea)])
        .then(function (values) {
         // AuditItemsData.audititems = values[0];
          AuditItemsData.itemdata = values[1];

          Object.keys(AuditItemsData.itemdata).forEach(function (itemkey) {
            if (values[0].hasOwnProperty(itemkey))
            AuditItemsData.audititems[itemkey] = values[0][itemkey];
          });
          m.redraw();
        }).catch(function (error) {
          M.toast({ html: 'Error: ' + error });
        });
      getDoc("ncitems", schedulekey)
        .then(function (value) {
          Object.keys(value).forEach(function (itemkey) {
            if (value[itemkey].hasOwnProperty("finding"))
              AuditItemsData.ncitems[itemkey] = value[itemkey];
          });
          m.redraw();
        }).catch(function (error) {
          M.toast({ html: 'Error: ' + error });
        });

    },
    dataDownload: function () {
      exportAuditData("score", AuditItemsData.audititems, AuditItemsData.itemdata, AuditItemsData.ncitems);
    }
  };
  const ActionItemsData = {
    data: [],
    ispending: true,
    setArea: function (area) {
      ActionItemsData.data = [];
      db.collection("ncitems").where("area", "==", area)
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            let data = doc.data();
            Object.keys(data).forEach(function (itemkey) {
              if (data[itemkey].hasOwnProperty("itemarea")) {
                data[itemkey]['itemkey'] = itemkey;
                //  data[itemkey]['schedulekey'] = doc.id;
                //  data[itemkey]['area'] = doc.data()["area"];
                ActionItemsData.data.push(data[itemkey]);
              }
            });
          });
          m.redraw();
        }).catch(function (error) {
          console.log("Error getting documents: ", error);
          M.toast({ html: 'Error getting nc items: ' + error });
        });
    },
    setSection: function (section) {
      ActionItemsData.data = [];
      db.collection("ncitems").where("section", "==", section)
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            let data = doc.data();
            Object.keys(data).forEach(function (itemkey) {
              if (data[itemkey].hasOwnProperty("itemarea")) {
                data[itemkey]['itemkey'] = itemkey;
                //  data[itemkey]['schedulekey'] = doc.id;
                //  data[itemkey]['area'] = doc.data()["area"];
                ActionItemsData.data.push(data[itemkey]);
              }
            });
          });
          m.redraw();
        }).catch(function (error) {
          console.log("Error getting documents: ", error);
          M.toast({ html: 'Error getting nc items: ' + error });
        });
    }
  };

  //--------View layer----------------------------
  //Section screen
  const SectionScreen = {
    view: function (vnode) {
      return [
        m(SectionHeader),
        m(".has-fixed-sidenav",
          m(SectionContainer)
        )
      ];
    }
  };
  const SectionContainer = {
    view: function (vnode) {
      return m(".container",
        m(".row",
          Object.keys(AuditResultData.area).map(function (section) {
            return m(SectionChartCard, { header: section, data: AuditResultData.data[section] });
          })
        )
      )
    }
  };
  const SectionChartCard = {
    oncreate: function (vnode) {
      let myChart = new Chart(vnode.dom.querySelector("canvas").getContext('2d'), {
        type: 'bar',
        data: {
          datasets: [{
            label: 'Score',
            data: vnode.attrs.data.score,
            backgroundColor: '#ff5722'
          }, {
            label: 'Target',
            data: vnode.attrs.data.target,
            // Changes this dataset to become a line
            type: 'line',
            backgroundColor: 'transparent',
            borderColor: '#dd2c00'
          }],
          labels: vnode.attrs.data.label
        },
        options: {
          scales: {
            yAxes: [{
              display: false,
              ticks: {
                display: false,
                min: 0,
                max: 100,
                fontColor: 'rgba(0, 0, 0, 0.7)'
              },
              gridLines: {
                display: false,
                color: 'rgba(0, 0, 0, 0.3)'
              }
            }],
            xAxes: [{
              // barPercentage:0.2,
              ticks: {
                fontColor: 'rgba(0, 0, 0, 0.7)'
              },
              gridLines: {
                display: false,
                color: 'rgba(0, 0, 0, 0.3)'
              }
            }]
          },
          legend: {
            display: false
          },
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
            }
          }
        }
      });
    },
    view: function (vnode) {
      return m(".col.s12.m6.l6",
        m(".card",
          [
            m(".card-content.card-title.primarytextcolor",
              vnode.attrs.header
            ),
            m("canvas"),
            m(".card-content",
              [
                m("div",
                  [
                    m("span.teal-text.text20",
                      "Action"
                    ),
                    m("span.teal-text.right.text20",
                      (vnode.attrs.data.nc - vnode.attrs.data.pending) + "/" + vnode.attrs.data.nc
                    )
                  ]
                ),
                m(".deep-orange.lighten-4.ncbar",
                  m(".deep-orange.ncbar", { style: { "width": vnode.attrs.data.nc === 0 ? "100%" : Math.round(100 - 100 * vnode.attrs.data.pending / vnode.attrs.data.nc) + "%" } })
                )
              ]
            ),
            m(".divider.cardelement"),
            m(".cardelement",
              [
                m("span.right",
                  m("a.waves-effect.waves-teal.btn-flat", { href: "/area/" + vnode.attrs.header, oncreate: m.route.link },
                    [
                      m("i.material-icons.right",
                        "arrow_forward"
                      ),
                      "to area"
                    ]
                  )
                ),
                m("span.right",
                  m("a.waves-effect.waves-teal.btn-flat", { href: "/action/" +  vnode.attrs.header, oncreate: m.route.link },
                    [
                      m("i.material-icons.right",
                        "arrow_forward"
                      ),
                      "nc"
                    ]
                  )
                ),
                m("span.right",
                  m("a.waves-effect.waves-teal.btn-flat", { href: "/schedule/" +  vnode.attrs.header, oncreate: m.route.link },
                    [
                      m("i.material-icons.right",
                        "arrow_forward"
                      ),
                      "schedule"
                    ]
                  )
                )])
          ]
        )
      );
    }
  };
  const AreaChartCard = {
    oncreate: function (vnode) {
      let myChart = new Chart(vnode.dom.querySelector("canvas").getContext('2d'), {
        type: 'bar',
        data: {
          datasets: [{
            label: 'Score',
            data: vnode.attrs.data.score,
            backgroundColor: '#ff5722'
          }, {
            label: 'Target',
            data: vnode.attrs.data.target,
            // Changes this dataset to become a line
            type: 'line',
            backgroundColor: 'transparent',
            borderColor: '#dd2c00'
          }],
          labels: vnode.attrs.data.label
        },
        options: {
          scales: {
            yAxes: [{
              display: false,
              ticks: {
                display: false,
                min: 0,
                max: 100,
                fontColor: 'rgba(0, 0, 0, 0.7)'
              },
              gridLines: {
                display: false,
                color: 'rgba(0, 0, 0, 0.3)'
              }
            }],
            xAxes: [{
              // barPercentage:0.2,
              ticks: {
                fontColor: 'rgba(0, 0, 0, 0.7)'
              },
              gridLines: {
                display: false,
                color: 'rgba(0, 0, 0, 0.3)'
              }
            }]
          },
          legend: {
            display: false
          },
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
            }
          }
        }
      });
    },
    view: function (vnode) {
      return m(".col.s12.m6.l6",
        m(".card",
          [
            m(".card-content.card-title.primarytextcolor",
              vnode.attrs.header
            ),
            m("canvas"),
            m(".card-content",
              [
                m("div",
                  [
                    m("span.teal-text.text20",
                      "Action"
                    ),
                    m("span.teal-text.right.text20",
                      (vnode.attrs.data.nc - vnode.attrs.data.pending) + "/" + vnode.attrs.data.nc
                    )
                  ]
                ),
                m(".deep-orange.lighten-4.ncbar",
                  m(".deep-orange.ncbar", { style: { "width": vnode.attrs.data.nc === 0 ? "100%" : Math.round(100 - 100 * vnode.attrs.data.pending / vnode.attrs.data.nc) + "%" } })
                )
              ]
            ),
            m(".divider.cardelement"),
            m(".cardelement",
              [
                m("span.right", 
                  m("a.waves-effect.waves-teal.btn-flat", { href: "/action/" + vnode.attrs.section + "/" + vnode.attrs.header, oncreate: m.route.link },
                    [
                      m("i.material-icons.right",
                        "arrow_forward"
                      ),
                      "nc"
                    ]
                  )
                ),
                m("span.right", 
                  m("a.waves-effect.waves-teal.btn-flat", { href: "/schedule/" + vnode.attrs.section + "/" + vnode.attrs.header, oncreate: m.route.link },
                    [
                      m("i.material-icons.right",
                        "arrow_forward"
                      ),
                      "schedule"
                    ]
                  )
                )])
          ]
        )
      );
    }
  };
  const SectionHeader = {
    oncreate: function (vnode) {
      M.Sidenav.init(vnode.dom.querySelector(".sidenav"));
    },
    view: function () {
      return m("div",[
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
        m("nav.primarycolor.has-fixed-sidenav",
          m(".nav-wrapper",
            [
              m("a.brand-logo.center[href='#']",
                "Performance"
              ),
              m("a.sidenav-trigger[data-target='slide-out'][href='#']",
                m("i.material-icons",
                  "menu"
                )
              )
            ]
          )
        ))
      ]);
    }
  };
  //Area screen
  const AreaHeader = {
    view: function (vnode) {
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
        m("nav.primarycolor.has-fixed-sidenav",
          m(".nav-wrapper",
            [
              m("a.brand-logo.center[href='#']",
                vnode.attrs.section
              ),
              m("a.left.headerbutton[href='/']", { oncreate: m.route.link },
                m("i.material-icons",
                  "arrow_back"
                )
              )
            ]
          )
        ))
      ]);
    }
  };
  const AreaContainer = {
    view: function (vnode) {
      return m(".container",
        m(".row",
          AuditResultData.area[vnode.attrs.section].map(function (area) {
            return m(AreaChartCard, { header: area, section: vnode.attrs.section, data: AuditResultData.data[area] });
          })
        )
      )
    }
  };
  const AreaScreen = {
    view: function (vnode) {
      return [
        m(AreaHeader, { section: vnode.attrs.section }),
        m(".has-fixed-sidenav",
          m(AreaContainer, { section: vnode.attrs.section })
        )
      ];
    }
  };
  //Schedule screen
  const ScheduleScreen = {
    oninit: function (vnode) {
      if(vnode.attrs.area)
      ScheduleData.setArea(vnode.attrs.area);
      else
      ScheduleData.setSection(vnode.attrs.section);
    },
    view: function (vnode) {
      return [
        m(ScheduleHeader, { area: vnode.attrs.area, section: vnode.attrs.section }),
        m(".has-fixed-sidenav",
        m(ScheduleContainer)
      )
      ];
    }
  };

  const ScheduleContainer = {
    view: function (vnode) {
      let temp=[];
      Object.keys(ScheduleData.data).map(function (schedulekey) {
        let scheduletmp=ScheduleData.data[schedulekey];
        scheduletmp["key"]=schedulekey;
        return temp.push(scheduletmp);
      });
      temp.sort(function (a, b) {
        return a.auditmonth.seconds - b.auditmonth.seconds;
      });
      return m(".container",
      temp.map(function (schedule) {
          return m(ScheduleCard, { schedulekey: schedule["key"], data: schedule});
        })
      );
    }
  };
  const ScheduleHeader = {
    view: function (vnode) {
      console.log(vnode.attrs.section);
      console.log(vnode.attrs.area);
      return [
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
      m("nav.primarycolor.has-fixed-sidenav",
        m(".nav-wrapper",
          [
            m("a.brand-logo.center[href='#']",
              (vnode.attrs.area?vnode.attrs.area:vnode.attrs.section)
            ),
            m("a.left.headerbutton", {class:(vnode.attrs.area?"":"hide"), href: "/area/" + vnode.attrs.section, oncreate: m.route.link },
              m("i.material-icons",
                "arrow_back"
              )
            ),
            m("a.left.headerbutton", {class:(vnode.attrs.area?"hide":""), href: "/", oncreate: m.route.link },
            m("i.material-icons",
              "arrow_back"
            )
          )
          ]
        )
      ))];
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
            m("a.waves-effect.waves-teal.btn-flat", { href: "/audit/" + vnode.attrs.schedulekey, oncreate: m.route.link },
              [
                m("i.material-icons.right.accenttextcolor",
                  "check"
                ),
                "Audit"
              ]
            )
          )
        ]
      );
    }
  };
  //Audit screen
  const AuditHeader = {
    oncreate: function (vnode) {
      M.Tabs.init(vnode.dom.querySelector(".tabs"));
    },
    view: function (vnode) {
      return m("div",
        [
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
                    vnode.attrs.area
                  ),
                  m("a.left.headerbutton", { href: "/schedule/" + vnode.attrs.section + "/" + vnode.attrs.area, oncreate: m.route.link },
                    m("i.material-icons",
                      "arrow_back"
                    )
                  ),
                  m("a.right.headerbutton[href='#']", { onclick: AuditItemsData.dataDownload },
                    m("i.material-icons",
                      "file_download"
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
        ])
        ;
    }
  };
  const AuditItemContainer = {
    view: function (vnode) {
      return m(".containerwithfixedheader", [
        m(".container[id='tabAuditItems']",
          Object.keys(AuditItemsData.audititems).map(function (itemkey) {
            return m(AuditItemCard, { itemkey: itemkey, itemdata: AuditItemsData.itemdata[itemkey], value: AuditItemsData.audititems[itemkey] });
          })),
        m(".container[id='tabNCItems']",
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
        m("p.text12.upperheader.secondarytextcolor", "Finding:"),
        m("p", vnode.attrs.ncitems.finding)
      ]
    )
      )
    }
  };
  const AuditItemCard = {
    view: function (vnode) {
      return m(".card.row",
        [
          m(".card-content",
            [
              m("span.primarytextcolor.textbold",
                vnode.attrs.itemdata.itemarea
              ),
              m("span.right.secondarytextcolor",
                vnode.attrs.itemkey
              ),
              m("p",
                vnode.attrs.itemdata.itemtext
              ),
              m("p.textitalic",
                vnode.attrs.itemdata.itemcriteria
              )
            ]
          ),
          m(".divider"),
          m(".mycheckcontainer",
            [
              m(".col.right",
                [
                  m(".radio-item.optionc",
                    [
                      m("input[radiovaluec=''][type='radio'][value=-1]",
                        {
                          id: 'cradio' + vnode.attrs.itemkey, name: 'radio' + vnode.attrs.itemkey, checked: vnode.attrs.value == -1 ? true : false,
                        }),
                      m("label", { for: 'cradio' + vnode.attrs.itemkey })
                    ]
                  ),
                  m(".radio-item.optionb",
                    [
                      m("input[radiovalueb=''][type='radio'][value=0]",
                        {
                          id: 'bradio' + vnode.attrs.itemkey, name: 'radio' + vnode.attrs.itemkey, checked: vnode.attrs.value == 0 ? true : false,
                        }),
                      m("label", { for: 'bradio' + vnode.attrs.itemkey })
                    ]
                  ),
                  m(".radio-item.optiona",
                    [
                      m("input[radiovaluea=''][type='radio'][value=10]",
                        {
                          id: 'aradio' + vnode.attrs.itemkey, name: 'radio' + vnode.attrs.itemkey, checked: vnode.attrs.value == 10 ? true : false,
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
    oninit: function (vnode) {
      AuditItemsData.setScheduleKey(vnode.attrs.schedulekey);
    },
    view: function (vnode) {
      return [
        m(AuditHeader, { schedulekey: vnode.attrs.schedulekey, section: ScheduleData.data[vnode.attrs.schedulekey].section, area: ScheduleData.data[vnode.attrs.schedulekey].area }),
        m(".has-fixed-sidenav",m(AuditItemContainer))
      ];
    }
  };
  //NC screen
  const ActionHeader = {
    oncreate: function (vnode) {
      M.Tabs.init(vnode.dom.querySelector(".tabs"));
    },
    view: function (vnode) {
      return m("div",
        [
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
                    (vnode.attrs.area?vnode.attrs.area:vnode.attrs.section)
                  ),
                  m("a.left.headerbutton", {class:(vnode.attrs.area?"":"hide"), href: "/area/" + vnode.attrs.section, oncreate: m.route.link },
                    m("i.material-icons",
                      "arrow_back"
                    )
                  ),
                  m("a.left.headerbutton", {class:(vnode.attrs.area?"hide":""), href: "/" + vnode.attrs.section, oncreate: m.route.link },
                    m("i.material-icons",
                      "arrow_back"
                    )
                  )
                ]
              ),
              m(".nav-content",
                m("ul.tabs.tabs-transparent.tabs-fixed-width",
                  [
                    m("li.tab",
                      m("a[href='#tabPendingAction']", { onclick: function () { ActionItemsData.ispending = true; } },
                        "Pending"
                      )
                    ),
                    m("li.tab",
                      m("a[href='#tabAllActions']", { onclick: function () { ActionItemsData.ispending = false; } },
                        "All"
                      )
                    )
                  ]
                )
              )
            ]
          )
        ]);
    }
  };
  const ActionContainer = {
    view: function () {
      return m(".container",
        ActionItemsData.data.map(function (ncitem) {
          if (((ncitem["status"] != "done") && (ncitem["status"] != "completed")) || (!ActionItemsData.ispending))
            return m(ActionItemCard, { ncitem: ncitem });
        })
      );
    }
  };
  const ActionItemCard = {
    view: function (vnode) {
      return m(".card.row",
        [m(".card-content",
          [
            m("span.primarytextcolor.textbold", vnode.attrs.ncitem.itemarea),
            m("span.right", vnode.attrs.ncitem.itemkey),
            m("p", vnode.attrs.ncitem.itemtext),
            m("p.textitalic", vnode.attrs.ncitem.itemcriteria),
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
        m("p.col.right.uppercase.footertext", vnode.attrs.ncitem.status
        )
        ]
      )
    }
  };
  const ActionScreen = {
    oninit: function (vnode) {
      if(vnode.attrs.area)
      ActionItemsData.setArea(vnode.attrs.area);
      else
      ActionItemsData.setSection(vnode.attrs.section);
    },
    view: function (vnode) {
      return [
        m(ActionHeader, { area: vnode.attrs.area, section: vnode.attrs.section }),
        m(".has-fixed-sidenav",m(ActionContainer))
      ];
    }
  };

  m.route(root, "/", {
    "/": SectionScreen,
    "/area/:section": AreaScreen,
    "/schedule/:section/:area": ScheduleScreen,
    "/schedule/:section": ScheduleScreen,
    "/audit/:schedulekey": AuditScreen,
    "/action/:section/:area": ActionScreen,
    "/action/:section": ActionScreen
    //  "/audit/:schedulekey": AuditScreen
  })

  //-------------------------------------------------
  function exportToExcel() {

    var tab_text = "<table border='2px'><tr bgcolor='#87AFC6'>" +
      "<th>section</th>" +
      "<th>area</th>";

    brewerylabel.forEach(function (labelmonth) {
      tab_text = tab_text + "<th>" + labelmonth + "</th>";
    });
    tab_text = tab_text + "</tr>";


    for (var section in score) {
      for (var area in score[section]) {

        tab_text = tab_text + "<tr><th>" +
          section +
          "</th><th>" +
          area +
          "</th>";
        brewerylabel.forEach(function (labelmonth) {
          let index = label[section][area].indexOf(labelmonth);
          if (index > -1) {
            tab_text = tab_text + "<th>" + score[section][area][index] + "</th>";
          } else {
            tab_text = tab_text + "<th></th>";
          }


        });
        tab_text = tab_text + "</tr>";

      }

    }

    tab_text = tab_text + "</table>";
    // tab_text= tab_text.replace(/<A[^>]*>|<\/A>/g, "");//remove if u want links in your table
    //tab_text= tab_text.replace(/<img[^>]*>/gi,""); // remove if u want images in your table
    //tab_text= tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params


    fnExcelReport(tab_text);


  }
  //----------------------Firebase user event-----------------------------   
  firebase.auth().onAuthStateChanged(function (firebaseUser) {
    if (firebaseUser) {
      Auth.setUser(firebaseUser);
      console.log('logged in');
      if (firebaseUser.emailVerified) {
        console.log('verified');
        AuditResultData.oninit();
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