(function () {
  'use strict';
  let root = document.body;

  var Auth = {
    email: "",
    password: "",
    signupemail: "",
    signuppassword: "",
    resetemail: "",
    signinerror: "",
    signuperror: "",
    signupname:"",
    signupsection: "",
    resetpassworderror: "",
    verifyemailerror: "",
    user: {},
    setUser: function (value) {
      Auth.user = value;
    },

    setEmail: function (value) {
      Auth.email = value;
    },
    setPassword: function (value) {
      Auth.password = value;
    },
    setSignUpName: function (value) {
      Auth.signupname = value;
    },
    setSignUpEmail: function (value) {
      Auth.signupemail = value;
    },
    setSignUpPassword: function (value) {
      Auth.signuppassword = value;
    },
    setSignUpSection: function (value) {
      Auth.signupsection = value;
    },
    setResetEmail: function (value) {
      Auth.resetemail = value;
    },
    signIn: function () {
      console.log("Try to log in");
     // m.route.set("/loading");
      Auth.signinerror = "";
      m.mount(root,LoadingScreen);
      firebase.auth().signInWithEmailAndPassword(Auth.email, Auth.password)
        .catch(function (error) {
          Auth.signinerror = "Error: " + error.message;
        //  m.route.set("/login");
        m.mount(root,SignInScreen);
          console.log(error);
          //  m.redraw();
          M.toast({ html: 'Sign in: ' + error });
        });

    },
    sendVerifyEmail: function () {
      Auth.verifyemailerror = "";
      firebase.auth().currentUser.sendEmailVerification().then(function () {
        // Email sent.
        M.toast({ html: 'Sent verification email.' });
      }).catch(function (error) {
        Auth.verifyemailerror = "Error: " + error.message;
        // An error happened.
        M.toast({ html: 'Error send verification email: ' + error });
      });
    },
    signUp: function () {
      console.log("Try to sign up");
     // console.log(Auth);
      //   m.route.set("/loading");
      Auth.signuperror = "";
      Auth.verifyemailerror = "";
      if(Auth.signupemail.split("@")[1]=="heineken.com"){
      firebase.auth().createUserWithEmailAndPassword(Auth.signupemail, Auth.signuppassword)
        .then(function (user) {
          firebase.auth().currentUser.updateProfile({
            displayName: Auth.signupsection + "-NA-NA"
          }).then(function () {
            M.toast({ html: 'Created new user successfully' });
          });
          firebase.auth().currentUser.sendEmailVerification().then(function () {
            // Email sent.
            M.toast({ html: 'Sent verification email.' });
          }).catch(function (error) {
            Auth.verifyemailerror = "Error: " + error.message;
            // An error happened.
            M.toast({ html: 'Error send verification email: ' + error });
          });
          let newemail={};
          newemail[Auth.signupemail]=Auth.signupname;
          db.collection("users").doc("USERS")
          .set(newemail,{merge:true})
          .then(function(docref){
            console.log("Saved user information");
          }).catch(function (error) {
            console.log(error);
          });

        }).catch(function (error) {
          //  m.route.set("/login");
          Auth.signuperror = "Error: " + error.message;
          console.log(error);
          M.toast({ html: 'Error: ' + error });
          // m.redraw();
        });
      }

    },
    signOut: function () {
      console.log("Try to log out");
      firebase.auth().signOut().then(function () {
        M.toast({ html: 'Sign out' });
        // m.route.set("/signin");
      }).catch(function (error) {
        M.toast({ html: 'Error: ' + error });
      });

    },
    sendResetPassword: function () {
      Auth.resetpassworderror = "";
      firebase.auth().sendPasswordResetEmail(Auth.resetemail).then(function () {
        //  m.route.set("/signin");
        M.toast({ html: 'Email sent, please check your inbox' });
      }).catch(function (error) {
        Auth.resetpassworderror = "Error: " + error.message;
        M.toast({ html: 'Error: ' + error });
        m.redraw();
      });
    }
  };


  var LoadingScreen = {
    view: function () {
      return m(".myloginloader",
        [m("div.center",
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
          )),
        m("h4.center.primarytextcolor",
          "Sign in"
        )
        ]
      )
    }
  };
  var SignInScreen = {
    oncreate: function (vnode) {
      //init ui
      M.Tabs.init(vnode.dom.querySelector(".tabs"));
      M.updateTextFields();
      M.FormSelect.init(vnode.dom.querySelector("select"));
    },
   
    view: function () {
      return m(".container",
        [
          m("h4.center.primarytextcolor",
            "QA audit"
          ),
          m(".card",
            [
              m(".card-tabs.",
                m("ul.tabs.tabs-fixed-width",
                  [
                    m("li.tab.indigo.",
                      m("a.white-text[href='#signin']",
                        "Sign in"
                      )
                    ),
                    m("li.tab.indigo",
                      m("a.white-text[href='#signup']",
                        "Sign up"
                      )
                    )
                  ]
                )
              ),
              m(".card-content[id='signin']",
                [

                  m(".input-field",
                    [
                      m("i.material-icons.prefix",
                        "mail"
                      ),
                      m("input.validate[id='txtEmail'][pattern='.+@heineken.com'][type='email']", { onchange: m.withAttr("value", Auth.setEmail)}),
                      m("label[for='txtEmail']",
                        "Email"
                      ),
                      m("span.helper-text[data-error='Please use your email as user@heineken.com'][data-success='right']")
                    ]
                  ),
                  m(".input-field.",
                    [
                      m("i.material-icons.prefix",
                        "lock"
                      ),
                      m("input.validate[id='txtPassword'][type='password']", { onchange: m.withAttr("value", Auth.setPassword)}),
                      m("label[for='txtPassword']",
                        "Password"
                      )
                    ]
                  ),
                  m(".row",

                    m("a.waves-effect.waves-light.btn-small.indigo.col.width100", { onclick: Auth.signIn },
                      "Sign in"
                    )
                  ),
                  m(".row",
                    m("a.text16.center-align.col.width100", { onclick: function () { m.mount(root, ResetPasswordScreen) } },
                      "Forgot password"
                    )),
                  m(".row.red-text", { class: Auth.signinerror == "" ? "hide" : "" }, Auth.signinerror)

                ]
              ),
              m(".card-content[id='signup']",
                [
                  m(".input-field",
                    [
                      m("i.material-icons.prefix",
                        "home"
                      ),
                      m("select",{ onchange: m.withAttr("value", Auth.setSignUpSection) },
                      [
                        m("option[disabled=''][selected=''][value='']", 
                          "Choose your section"
                        ), 
                        m("option[value='PKG']", 
                          "Packaging"
                        ), 
                        m("option[value='BRW']", 
                          "Brewing"
                        ), 
                        m("option[value='TEC']", 
                          "Technology"
                        ),
                        m("option[value='OTHERS']", 
                        "Others"
                      )]
                      ),
                      m("label",
                        "Section"
                      ),
                      
                      m("span.helper-text[data-error=''][data-success='right']")
                    ]
                  ),
                      m(".input-field",
                      [
                        m("i.material-icons.prefix",
                          "person"
                        ),
                        m("input[id='txtSignUpName'][type='text']", { oninput: m.withAttr("value", Auth.setSignUpName) }),
                        m("label[for='txtSignUpName']",
                          "Name"
                        ),
                        m("span.helper-text[data-error=''][data-success='right']")
                      ]
                    ),
                  m(".input-field",
                    [
                      m("i.material-icons.prefix",
                        "mail"
                      ),
                      m("input.validate[id='txtSignUpEmail'][pattern='.+@heineken.com'][type='email']", { oninput: m.withAttr("value", Auth.setSignUpEmail)}),
                      m("label[for='txtSignUpEmail']",
                        "Email"
                      ),
                      m("span.helper-text[data-error='Please use your email as user@heineken.com'][data-success='right']")
                    ]
                  ),
                  m(".input-field.",
                    [
                      m("i.material-icons.prefix",
                        "lock"
                      ),
                      m("input.validate[id='txtSignUpPassword'][type='password']", { oninput: m.withAttr("value", Auth.setSignUpPassword)}),
                      m("label[for='txtSignUpPassword']",
                        "Password"
                      )
                    ]
                  ),
                  m(".row",
                    m("a.waves-effect.waves-light.btn-small.indigo.col.width100[id='btnSignUp']", { onclick: Auth.signUp },
                      "Sign up"
                    )
                  ),
                  m(".row.red-text", { class: Auth.signuperror == "" ? "hide" : "" }, Auth.signuperror)

                ]
              )

            ]
          )
        ]
      )
    }
  };
  var ResetPasswordScreen = {


    view: function () {
      return m(".container",
        [m("h4.center.primarytextcolor",
          "Reset password"
        ),
        m(".card",
          [
            m(".card-content[id='forgotpassword']",
              [
                m(".input-field",
                  [
                    m("i.material-icons.prefix",
                      "mail"
                    ),
                    m("input.validate[id='txtForgotEmail'][pattern='.+@heineken.com'][type='email']", { oninput: m.withAttr("value", Auth.setResetEmail), value: Auth.resetemail }),
                    m("label[for='txtForgotEmail']", { class: (Auth.resetemail ? "active" : "") },
                      "Email"
                    ),
                    m("span.helper-text[data-error='Please use your email as user@heineken.com'][data-success='right']")
                  ]
                ),
                m(".row",
                  m("a.waves-effect.waves-light.btn-small.indigo.col.width100", { onclick: Auth.sendResetPassword },
                    "Reset password"
                  )
                ),
                m(".row",
                  m("a.waves-effect.waves-light.btn-small.amber.col.width100", { onclick: function () { m.mount(root, SignInScreen) } },
                    "Back to sign in"
                  )
                ),
                m(".red-text", { class: Auth.resetpassworderror == "" ? "hide" : "" }, Auth.resetpassworderror)
              ]
            )
          ]
        )
        ]
      )
    }
  };
  var VerifyEmailScreen = {
    view: function () {
      return m(".container",
        [m("h4.center.primarytextcolor",
          "Your email is not verified"
        ),
        m(".card",
          [
            m(".card-content",
              [
                m(".row",
                  m("a.waves-effect.waves-light.btn-small.indigo.col.width100", { onclick: Auth.sendVerifyEmail },
                    "Didn't receive email, send verification email again"
                  )
                ),
                m(".row",
                  m("a.waves-effect.waves-light.btn-small.indigo.col.width100", { onclick: function(){window.location.href = "index.html";} },
                    "Already verified email"
                  )
                ),
                m(".row",
                  m("a.waves-effect.waves-light.btn-small.amber.col.width100", { onclick: function () { m.mount(root, SignInScreen) } },
                    "Back to sign in"
                  )
                ),
                m(".red-text", { class: Auth.verifyemailerror == "" ? "hide" : "" }, Auth.verifyemailerror)
              ]
            )
          ]
        )
        ]
      )
    }
  };

  var HomeScreen = {
    view: function (vnode) {
      return m("div", [
        m(AppHeader),
        m(FloatButton),
        m(AllTagContainer)
      ])
    }
  };
  var AppHeader = {
    oncreate: function (vnode) {
      //init ui
      M.Dropdown.init(vnode.dom.querySelector(".dropdown-trigger"));
    },
    view: function () {
      return m("div",
        [
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
          m("nav",
            m(".nav-wrapper.indigo",
              [
                m("a.brand-logo",
                  "Tag system M"
                ),
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
            )
          )
        ]
      )
    }
  };
  const DropDown = {
    onupdate: function (vnode) {
      console.log("update select " + vnode.attrs.label);
      M.FormSelect.init(vnode.dom.querySelector("select"));
    },
    oncreate: function (vnode) {
      console.log("init select " + vnode.attrs.label);
      // M.AutoInit(vnode.dom);
      M.FormSelect.init(vnode.dom.querySelector("select"));
    },
    view: function (vnode) {
      return m(".input-field", { class: vnode.attrs.class },
        [
          m("select", { onchange: vnode.attrs.onchange, value: vnode.attrs.value, id: vnode.attrs.id },
            [
              m("option[disabled=true][selected=true][value='']", vnode.attrs.text),
              vnode.attrs.items.map(function (item) {
                return m("option", { value: item.value }, item.description);
              })
            ]
          ),
          m("label",
            vnode.attrs.label
          )
        ]
      )

    }
  };
  m.mount(root, LoadingScreen);

  //-------------------------------------------------
  function currentdate() {
    var monthNames = [
      "Jan", "Feb", "Mar",
      "Apr", "May", "Jun", "Jul",
      "Aug", "Sep", "Oct",
      "Nov", "Dec"
    ];
    var date = new Date();
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + ' ' + monthNames[monthIndex] + ' ' + year;
  }
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
  function processPicture(e) {
    return new Promise(function (resolve, reject) {
      var file = e.target.files[0];
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
          document.getElementById('inputpicture').classList.remove("hide");
          //  console.log("inserted piture" + imgurl);
          // m.redraw();
          return resolve(imgurl);
        });

      }
      reader.readAsDataURL(file);
    });
  }

  //----------------------Firebase user event-----------------------------   
  //firebase.auth().signOut();
  firebase.auth().onAuthStateChanged(function (firebaseUser) {
    if (firebaseUser) {
      console.log('logged in');
      // M.toast({ html: 'Sign in' });
      Auth.setUser(firebaseUser);
      if (firebaseUser.emailVerified) {
        console.log('verified');
        window.location.href = "schedule.html";
      }
      else {
        m.mount(root, VerifyEmailScreen);
      }

    } else {
      Auth.setUser(firebaseUser);

      console.log('not logged in');
      //  m.route.set("/signin");
      m.mount(root, SignInScreen);
    } // end else statement
  }); // end function


}());