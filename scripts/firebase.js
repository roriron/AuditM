var config = {
  apiKey: "xxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "qaauditsystemhvb.firebaseapp.com",
  databaseURL: "https://qaauditsystemhvb.firebaseio.com",
  projectId: "qaauditsystemhvb",
  storageBucket: "qaauditsystemhvb.appspot.com",
  messagingSenderId: "1086608640029"
};
var app= firebase.initializeApp(config);
firebase.firestore().settings({ timestampsInSnapshots: true });
var db = firebase.firestore(app);