if (firebaseConfig && typeof firebase != 'undefined') {
  firebase.initializeApp(firebaseConfig)

  const initApp = function () {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        var email = user.email
        localStorage.setItem('email', email)
        document.getElementById('save').style.display = 'block'
        document.getElementById('firebaseui-auth-container').style.display = 'none'
        document.getElementById('logout').style.display = 'grid'
      } else {
        document.getElementById('save').style.display = 'none'
        document.getElementById('firebaseui-auth-container').style.display = 'block'
        document.getElementById('logout').style.display = 'none'
        localStorage.removeItem('email')
      }
      const currEmail = localStorage.getItem('email')
      const drafts = Object.keys(localStorage).filter(draft => draft.startsWith('draft-'))
      let currDocuments = localStorage.getItem('documents')

      if (drafts.length) {
        let documents = []
        drafts.forEach((doc) => {
          documents.push({
            id: doc,
            content: localStorage.getItem(doc),
            saved: false
          })
          localStorage.removeItem(doc)
        })
        localStorage.setItem("documents", JSON.stringify(documents))
      }

      if (currEmail) {
        window.db = firebase.firestore()
        window.addEventListener("beforeunload", async () => {
          let currDocuments = JSON.parse(currDocuments)
          currDocuments = localStorage.getItem('documents')
          if (currDocuments) {
            currDocuments = currDocuments ? currDocuments.filter(doc => !doc.saved) : []
            if (currDocuments && currDocuments.length) {
              currDocuments.forEach(async (doc) => {
                await window.db.collection("documents").doc(doc.id).update(data)
                  .then(() => {
                    documents = documents.filter(d => d.id != doc.id)
                    documents.push({
                      id: doc.id,
                      ...data
                    })
                    localStorage.setItem("documents", JSON.stringify(documents))
                    return documents
                  })
                  .catch((error) => {
                    console.error("Error updating document: ", error);
                  });
              })
            }
          }
          return;
        });
        window.db.collection("documents").where("email", "==", currEmail).orderBy("timestamp", "desc").get()
          .then((querySnapshot) => {
            let documents = []

            querySnapshot.forEach((doc) => {
              documents.push({
                id: doc.id,
                ...doc.data(),
                saved: true
              })
            })

            currDocuments = localStorage.getItem('documents')
            if (currDocuments) {
              currDocuments = JSON.parse(currDocuments)
              currDocuments = currDocuments ? currDocuments.filter(doc => !doc.saved) : []
              if (currDocuments && currDocuments.length) {
                const toSync = confirm('You have unsaved drafts, save them to your account? (If you choose no, your unsaved drafts might be gone.)')
                if (toSync) {
                  let id = ''
                  const url = new URLSearchParams(window.location.search)
                  if (url.has('id')) {
                    id = url.get('id')
                  }

                  currDocuments.forEach(async (doc) => {
                    const isOnDocuments = documents.find(d => d.id == doc.id)
                    const data = {
                      email: currEmail,
                      content: doc.content || '',
                      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                      saved: true
                    }

                    if (!isOnDocuments) {
                      await window.db.collection("documents").add(data)
                        .then((docRef) => {
                          documents.push({
                            id: docRef.id,
                            ...data
                          })
                          localStorage.setItem("documents", JSON.stringify(documents))
                          if (doc.id == id) history.replaceState('', "BBCode Live Editor", "?id=" + docRef.id)
                          return documents
                        })
                        .catch((error) => {
                          console.error("Error adding document: ", error);
                        });

                    }
                  })
                }
              }
            }

            parser.init()
            editor.init()
            theme.init()
          }).catch((error) => {
            console.error(error)
            parser.init()
            editor.init()
            theme.init()
          })
      } else {
        parser.init()
        editor.init()
        theme.init()
      }
    }, function (error) {
      parser.init()
      editor.init()
      theme.init()
      console.log(error)
    })
  }

  window.addEventListener('load', function () {
    initApp()
  })

  const ui = new firebaseui.auth.AuthUI(firebase.auth())

  const uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        localStorage.setItem('email', authResult.email || '')
        return true
      }
    },
    signInFlow: 'popup',
    signInSuccessUrl: window.location.href,
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ]
  }

  ui.start('#firebaseui-auth-container', uiConfig)
} else {
  parser.init()
  editor.init()
  theme.init()
}