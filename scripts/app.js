Date.prototype.mmyyyy = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [(mm>9 ? '' : '0')+mm,'-',this.getFullYear()
         ].join('');
};
function fbTimeToMMYYYY(fbtime) {
  let date = new Date(fbtime.seconds*1000);
  let mm = date.getMonth() + 1; // getMonth() is zero-based
 // let dd = date.getDate();

  return [(mm>9 ? '' : '0')+mm,'-',date.getFullYear()
         ].join('');
}
function fbTimeToMMMYY(fbtime) {
  if(!fbtime) return "Jan-90";
  let date = new Date(fbtime.seconds*1000);

  var m_names = new Array("Jan", "Feb", "Mar", 
"Apr", "May", "Jun", "Jul", "Aug", "Sep", 
"Oct", "Nov", "Dec");

  let mm = date.getMonth(); // getMonth() is zero-based
  let year=date.getFullYear();
  return m_names[mm]+'-'+year.toString().substring(2);
//return m_names[mm]+'-'+year;
}
function fbTimeToDDMMMYYYY(fbtime) {
  if(!fbtime) return "01-Jan-1990";
  let date = new Date(fbtime.seconds*1000);

  var m_names = new Array("Jan", "Feb", "Mar", 
"Apr", "May", "Jun", "Jul", "Aug", "Sep", 
"Oct", "Nov", "Dec");

  let mm = date.getMonth(); // getMonth() is zero-based
  let dd = date.getDate();

  return [(dd>9 ? '' : '0')+dd,'-',m_names[mm],'-',date.getFullYear()
         ].join('');
}
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
function fnExcelReport(tab_text){
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf("MSIE ");
 // var txtArea1 = document.createElement('iframe.hide');
  //document.body.appendChild(txtArea1);
  var txtArea1 = document.querySelector('.excelFrame');
  if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
  {
      txtArea1.contentDocument.open("txt/html","replace");
      txtArea1.contentDocument.write(tab_text);
      txtArea1.contentDocument.close();
      txtArea1.focus(); 
      ua=txtArea1.contentDocument.execCommand("SaveAs",true,"audit.xls");
  }  
  else                 //other browser not tested on IE 11
  ua = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));  
  return (ua);
}
function exportAuditData(score,audititems,itemdata,ncitems) {
  var tab_text = "<table border='2px'><tr bgcolor='#87AFC6'>" +
    "<th>ID</th>" +
    "<th>area</th>" +
    "<th>item text</th>" +
    "<th>item criteria</th>" +
    "<th>" +score+ "</th>" +
    "<th>finding description</th>" +
    "</tr>";
  for (var prop in audititems) {
    tab_text = tab_text + "<tr><th>" +
      prop +
      "</th><th>" +
      itemdata[prop]["itemarea"] +
      "</th><th style='text-align:left;'>" +
      itemdata[prop]["itemtext"] +
      "</th><th style='text-align:left;'>" +
      itemdata[prop]["itemcriteria"] +
      "</th><th>" +
      audititems[prop] +
      "</th><th style='text-align:left;'>" +
      (ncitems.hasOwnProperty(prop) ? ncitems[prop]["finding"] : "") +
      "</th>" + "</tr>";
  }

  tab_text = tab_text + "</table>";
  // tab_text= tab_text.replace(/<A[^>]*>|<\/A>/g, "");//remove if u want links in your table
  //tab_text= tab_text.replace(/<img[^>]*>/gi,""); // remove if u want images in your table
  //tab_text= tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params
  fnExcelReport(tab_text);
}



(function () {

  //If serviceWorker supports, then register it.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('serviceWorker.js').then(function(registration) {
      console.log('ServiceWorker registration successful!');
    }).catch(function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  }





  window.addEventListener('online', function () {

//   document.querySelector('.connectivity-status').innerText = 'online';
M.toast({html:'Online'});
//document.body.classList.add("indigo");
//document.body.classList.remove("blue-grey");

  })

  window.addEventListener('offline', function () {
M.toast({html:'Offine, please check your internet connection'});
//      document.querySelector('.connectivity-status').innerText = 'offline';
//document.body.classList.add("blue-grey");
//document.body.classList.remove("indigo");
  });



})();
