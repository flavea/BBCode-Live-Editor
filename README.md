# BBCode Live Editor
[![Netlify Status](https://api.netlify.com/api/v1/badges/9c3a5902-9208-4039-a08d-984253ded8fd/deploy-status)](https://app.netlify.com/sites/bbcode-editor/deploys)

**Current Features**
* Live preview
* Sync Scrolling
* Several Themes: Clear Sky, Sunset, Dawn, Glutton
* Changing editor and preview font and font size
* Shortcuts
* Can be installed as a PWA
* Save as text file
* Open txt and docx file
* Save and sync on cloud

**Note**

To run locally and enable cloud/firebase, add your own configuration on `firebase.js`. On your firebase project, create a database on firestore and create document named 'documents'.

```const firebaseConfig = {
    apiKey: apiKey,
    authDomain: authDomain,
    projectId: projectId,
    storageBucket: storageBucket
    messagingSenderId: messagingSenderId,
    appId: appId
};```

**Credits**
*   Inspired by [Marcdown](https://github.com/liyasthomas/marcdown).
*   Using javascript bbcode rendering from [qgustavor](https://codepen.io/qgustavor/pen/RaZmVR).