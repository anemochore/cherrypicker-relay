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
  console.log2('기다리라우...');
  const output = document.getElementById('content');
  output.style.backgroundImage = 'url("spinner.gif")';
  output.alt = 'loading...';

  //get folder
  //const folder = await getFolder();
  folder = {id: '1ZB7TC1sYyYOCUaeIFiXJpb5fCLJeirf7'};  //dev
  if(!folder.id) {
    console.log2('구글 드라이브에서 폴더를 읽을 수 없습니다. :(', folder);
    //todo: 폴더를 수동으로 고르게 해주자??
    return;
  }

  //get the latest file
  /*
  const file = await getLatestFile(folder.id);
  if(!file.id) {
    console.log2('구글 드라이브 폴더에서 파일을 읽을 수 없습니다. :(', folder);
    //todo: 폴더를 수동으로 고르게 해주자??
    return;
  }
  */

  //load it
  file = {id: '1AeLjyBb6pExwYcvVRsIRz8gC7l7FrqxZ'};  //dev
  //const url = getUrl(file.id);
  url = 'https://github.com/lerocha/chinook-database/raw/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite';  //dev
  const db = loadSql(url);

  //query it
  const content = db.exec("SELECT * FROM my_table");
  console.log(content);

  //
}


async function getFolder() {
  return;
}

async function getLatestFile(folder) {
  return;
}

async function getUrl(id) {
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
const CLIENT_ID = '484499455751-m0ck74mc8lkiffj3t6o7p7sk08jerlsk.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAwh4ElKmAhfmTBmdimD9vPAuGws6chirg';
const SCOPE = 'http://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOC = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';


/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  /*
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  */

  //from google one log-in example
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: '',
  });
  google.accounts.id.prompt();
  
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.visibility = 'visible';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    document.getElementById('signout_button').style.visibility = 'visible';
    document.getElementById('authorize_button').innerText = '다시 로그인';
    await run();
  };

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({prompt: ''});
  }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    //document.getElementById('content').innerText = '';
    document.getElementById('authorize_button').innerText = '구글 로그인';
    document.getElementById('signout_button').setAttributestyle.visibility = 'hidden';
  }
}
