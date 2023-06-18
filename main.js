//log singleton
const HTML_CONSOLE = document.getElementById('log');
console.log2 = (...args) => {
   const t = [...args].join('\n');
  if(t == '')
    HTML_CONSOLE.innerText = 'log cleared.';
  else {
    HTML_CONSOLE.innerText = t;
    console.log(...args);
  }
}

//load sql.js
//const initSqlJs = window.initSqlJs;
const SQL = initSqlJs({
  //locateFile: file => `https://sql.js.org/dist/${file}`
  locateFile: file => `dist/${file}`
});


async function run(e) {
  //init
  console.log('기다리라우...');
  const output = document.getElementById('output');
  output.style.backgroundImage = 'url("spinner.gif")';
  output.alt = 'loading...';

  //get folder
  const folder = getFolder();
  if(!folder.id) {
    console.log2('구글 드라이브에서 폴더를 읽을 수 없습니다. :(', folder);
    //todo: 폴더를 수동으로 고르게 해주자??
    return;
  }

  //get the latest file
  const file = getLatestFile(folder);
  if(!file.id) {
    console.log2('구글 드라이브 폴더에서 파일을 읽을 수 없습니다. :(', folder);
    //todo: 폴더를 수동으로 고르게 해주자??
    return;
  }

  //load it
  //const url = getUrl(file.id);
  url = 'https://github.com/lerocha/chinook-database/raw/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite';  //dev
  const db = loadSql(url);

  //query it
  const content = db.exec("SELECT * FROM my_table");
  console.log(content);

  //
}

function getLatestFile(folder) {
  return;
}

function getUrl(id) {
  id = '1AeLjyBb6pExwYcvVRsIRz8gC7l7FrqxZ';  //dev

  //https://stackoverflow.com/a/39408884/6153990
  gapi.client.drive.files.get({
    fileId: id,
    fields: 'webContentLink'
  }).then(function(success){
      const webContentLink = success.result.webContentLink; //the link is in the success.result object
      return webContentLink;
  }, function(fail){
      console.log(fail);
      console.log('Error: ', fail.result.error.message);
  })
}

async function loadSql(url) {
  const dataPromise = fetch(url).then(res => res.arrayBuffer());
  const buf = await Promise(dataPromise)
  const db = new SQL.Database(new Uint8Array(buf));
  return db;
}


//gapi boilerplates
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  const API_KEY = 'AIzaSyAwh4ElKmAhfmTBmdimD9vPAuGws6chirg';
  const CLIENT_ID = '484499455751-m0ck74mc8lkiffj3t6o7p7sk08jerlsk.apps.googleusercontent.com';
  const SCOPE = 'http://www.googleapis.com/auth/drive.readonly';
  const D_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

  gapi.client.init({
    'apiKey': API_KEY,
    'clientId': CLIENT_ID,
    'scope': SCOPE,
    'discoveryDocs': D_DOCS,
  }).then(function() {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  });
}

function updateSigninStatus(isSignedIn) {
  if(isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    UPDATE_DIV.style.display = 'block';
    updatedRun();
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    UPDATE_DIV.style.display = 'none';
  }
}

function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}
