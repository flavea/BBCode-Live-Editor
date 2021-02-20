const editor = {
    file: document.getElementById('file'),
    apply: function (code, type = null) {
        let before
        let after
        switch (code) {
            case 'bold':
                before = '[b]'
                after = '[/b]'
                break
            case 'italic':
                before = '[i]'
                after = '[/i]'
                break
            case 'strike':
                before = '[s]'
                after = '[/s]'
                break
            case 'underline':
                before = '[u]'
                after = '[/u]'
                break
            case 'quote':
                before = '[quote]'
                after = '[/quote]'
                break
            case 'list':
                before = '[list]'
                after = '[/list]'
                break
            case 'li':
                before = '[*]'
                after = ''
                break
            case 'code':
                before = '[code]'
                after = '[/code]'
                break
            case 'link':
                const link = prompt('Insert your link')
                before = `[url=${link}]`
                after = '[/url]'
                break
            case 'image':
                before = '[img]'
                after = '[/img]'
                break
            case 'hr':
                before = '[hr]'
                after = ''
                break
            case 'table':
                before = '[table][tr][td]'
                after = '[/td][/tr][/table]'
                break
            case 'html':
                before = '[dohtml]'
                after = '[/dohtml]'
                break
            case 'roll':
                before = '[roll]'
                after = '[/roll]'
                break
            case 'color':
                const color = type != null ? type : document.getElementById('color').value
                before = `[color=${color}]`
                after = '[/color]'
                break
            case 'size':
                before = `[size=${type}]`
                after = '[/size]'
                break
            case 'font':
                before = `[font=${type}]`
                after = '[/font]'
                break
            case 'align':
                before = `[align=${type}]`
                after = '[/align]'
                break
        }
        document.querySelectorAll('#buttons select').forEach(el => el.value = 0);
        if (document.selection) {
            parser.input.focus()
            document.selection.createRange().text = before + document.selection.createRange().text + after
        } else if (parser.input.selectionStart || parser.input.selectionStart == '0') {
            let startPos = parser.input.selectionStart
            let endPos = parser.input.selectionEnd
            let inBetween = parser.input.value.substring(startPos, endPos)
            if (!inBetween) {
                if (code == 'image') {
                    inBetween = prompt('Insert your image link')
                } else if (code == 'link') {
                    inBetween = prompt('Insert your link name/text')
                } else if (code == 'roll') {
                    inBetween = prompt('Insert your dice roll code (ex: 1d6, 1d3+2)')
                }
            }
            parser.input.value = parser.input.value.substring(0, startPos) + before + inBetween + after + parser.input.value.substring(endPos, parser.input.value.length)
            parser.input.selectionStart = startPos + before.length
            parser.input.selectionEnd = endPos + before.length
            parser.input.focus()
        }
        parser.render()
    },
    shortcuts: function (e) {
        if (e.ctrlKey && e.which == 66) {
            editor.apply('bold')
        } else if (e.ctrlKey && e.shiftKey && e.which == 85) {
            editor.apply('underline')
        } else if (e.ctrlKey && e.which == 73) {
            editor.apply('italic')
        } else if (e.ctrlKey && e.which == 69) {
            editor.apply('align', 'center')
        } else if (e.ctrlKey && e.shiftKey && e.which == 82) {
            editor.apply('align', 'right')
        } else if (e.ctrlKey && e.shiftKey && e.which == 74) {
            editor.apply('align', 'justify')
        } else if (e.ctrlKey && e.shiftKey && e.which == 76) {
            editor.apply('link')
        }
    },
    getDrafts: function (id) {
        let documents = localStorage.getItem('documents')
        if (documents) {
            documents = JSON.parse(documents)
            if (id) {
                const data = documents.find(doc => doc.id == id)
                return data
            } else {
                return documents
            }
        }

        return []
    },
    setDrafts: function () {
        const drafts = parser.getDrafts()
        const selector = document.getElementById('drafts-list')
        let html = ''
        drafts.forEach((draft, i) => {
            let content = draft.content.split('.')[0]
            html += `<div class="draft"><div>${content}</div><div class="flex"><button onclick="editor.open('${draft.id}')">Open</button> <button class="delete" onclick="editor.delete('${draft.id}')"><i class="fas fa-trash"></i> Delete</button></div></div>`

        })
        selector.innerHTML = html
    },
    openMenu: function () {
        modal.open('menu')
        editor.setDrafts()
    },
    new: function () {
        const email = localStorage.getItem('email')
        let id = 'draft-' + parser.uuid()
        const data = {
            content: defaultContent,
            email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }
        if (email && window.db) {
            window.db.collection("documents").add(data)
                .then((docRef) => {
                    let documents = localStorage.getItem('documents')
                    documents = documents ? JSON.parse(documents) : []
                    documents.push({
                        id: docRef.id,
                        ...data,
                        saved: true
                    })
                    localStorage.setItem("documents", JSON.stringify(documents))

                    parser.output.innerHTML = parser.input.value = defaultContent
                    editor.open(docRef.id)
                })
                .catch((error) => {
                    parser.output.innerHTML = parser.input.value = defaultContent
                    editor.open(id)
                    console.error("Error adding document: ", error);
                });
        } else {
            parser.output.innerHTML = parser.input.value = defaultContent
            editor.open(id)
        }
    },
    open: function (key) {
        history.pushState('', "BBCode Live Editor", "?id=" + key)
        parser.render(true)
        modal.close()
    },
    saveFile: function () {
        const type = "text/plain;charset=utf-8"
        const url = new URLSearchParams(window.location.search)
        const id = url.get('id') + '.txt'
        const t = parser.input.value
        try {
            var b = new Blob([t], {
                type: type
            });
            saveAs(b, id);
        } catch (e) {
            window.open("data:" + id + "," + encodeURIComponent(t), '_blank', '');
        }
    },
    delete: function (key, i) {
        const url = new URLSearchParams(window.location.search)
        let drafts = editor.getDrafts()

        if (confirm('Are you sure you want to delete this draft?')) {
            const email = localStorage.getItem('email')

            if (email && window.db) {
                window.db.collection("documents").doc(key).delete()
            }

            if (drafts.length === 1) {
                localStorage.setItem('documents', '[]')
                editor.new()
            } else if (url.get('id') === key) {
                drafts = drafts.filter(d => d.id != key)
                localStorage.setItem('documents', JSON.stringify(drafts))
                const temp = drafts[0]
                parser.input.value = temp.content || ''
                history.pushState('', "BBCode Live Editor", "?id=" + temp.id)
            } else {
                drafts = drafts.filter(d => d.id != key)
                localStorage.setItem('documents', JSON.stringify(drafts))
            }

            editor.setDrafts()
            parser.render()
        }
    },
    save: function () {
        const email = localStorage.getItem('email')
        if (email && window.db) {
            document.getElementById('save').innerHTML = 'Saving...'
            const url = new URLSearchParams(window.location.search)
            if (url.has('id')) {
                id = url.get('id')
                const draft = parser.getDrafts(id)
                if (draft && draft.content && !Boolean(draft.saved)) {
                    const data = {
                        ...draft,
                        saved: true,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }

                    window.db.collection("documents").doc(id).update(data)
                        .then(() => {
                            console.log(new Date(), 'Saving...')
                            let drafts = parser.getDrafts()
                            drafts = drafts.filter(d => d.id != id)
                            drafts = [data, ...drafts]

                            localStorage.setItem('documents', JSON.stringify(drafts))
                            document.getElementById('save').innerHTML = 'Save'
                        })
                        .catch((error) => {
                            console.error(new Date(), error)
                            document.getElementById('save').innerHTML = 'Save'
                        });
                } else {
                    document.getElementById('save').innerHTML = 'Save'
                }
            } else {
                document.getElementById('save').innerHTML = 'Save'
            }
        }
    },
    openTab: function (which) {
        document.querySelectorAll('#switch-mode button').forEach(el => {
            if (el.id === which) el.classList.add('tabOpen')
            else el.classList.remove('tabOpen')
        });
        if (which === 'editor-switch') {
            document.getElementById('left').style.display = 'block'
            document.getElementById('right').style.display = 'none'
        }
        if (which === 'preview-switch') {
            document.getElementById('left').style.display = 'none'
            document.getElementById('right').style.display = 'block'
        }
    },
    logout: function() {
        firebase.auth().signOut()
        localStorage.removeItem('email')
    },
    init: function () {
        editor.setDrafts()
        setInterval(() => {
            editor.save()
        }, 20000);

        document.onkeyup = editor.shortcuts
        editor.file.addEventListener("change", function () {
            if (this.files && this.files[0]) {
                var myFile = this.files[0];
                if (myFile.size < 100000) {
                    const filename = myFile.name.split('.')
                    if (['docx', 'txt'].includes(filename[filename.length - 1])) {
                        var reader = new FileReader();
                        let fname = filename[0]
                        if (filename[filename.length - 1].includes('doc')) {
                            reader.addEventListener('load', function (e) {
                                mammoth.convertToHtml({
                                    arrayBuffer: e.target.result
                                }).then(function (resultObject) {
                                    let html = resultObject.value
                                    html = html.replace(/<b>/ig, '[b]');
                                    html = html.replace(/<strong>/ig, '[b]');
                                    html = html.replace(/<\/b>/ig, '[/b]');
                                    html = html.replace(/<\/strong>/ig, '[/b]');
                                    html = html.replace(/<em>/ig, '[i]');
                                    html = html.replace(/<ul>/ig, '[list]');
                                    html = html.replace(/<\/ul>/ig, '[/list]');
                                    html = html.replace(/<ol>/ig, '[list=1]');
                                    html = html.replace(/<\/ol>/ig, '[/list]');
                                    html = html.replace(/<\/em>/ig, '[/i]');
                                    html = html.replace(/<\/div>/ig, '\n');
                                    html = html.replace(/<\/li>/ig, '');
                                    html = html.replace(/<li>/ig, '[*]');
                                    html = html.replace(/<\/ul>/ig, '\n');
                                    html = html.replace(/<\/p>/ig, '\n');
                                    html = html.replace(/<br\s*[\/]?>/gi, "\n");
                                    html = html.replace(/<\/p>/ig, '\n');
                                    html = html.replace(/<p\s*[\/]?>/gi, "\n");
                                    parser.input.value = html
                                    history.pushState('', "BBCode Live Editor", "?id=" + fname)
                                    const email = localStorage.getItem('email')
                                    if (email && window.db) {
                                        const data = {
                                            content: html,
                                            email,
                                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                        }
                                        window.db.collection("documents").doc(fname).add({
                                                data
                                            })
                                            .then((docRef) => {
                                                let documents = localStorage.getItem('documents')
                                                documents = documents ? JSON.parse(documents) : []
                                                documents.push({
                                                    id: fname,
                                                    ...data,
                                                    saved: true
                                                })
                                                localStorage.setItem("documents", JSON.stringify(documents))
                                            })
                                            .catch((error) => {
                                                console.error("Error adding document: ", error);
                                            });
                                    }
                                    parser.render()
                                    modal.close()
                                })
                            });
                            reader.readAsArrayBuffer(myFile);
                        } else if (filename[filename.length - 1].includes('txt')) {
                            reader.addEventListener('load', function (e) {
                                parser.input.value = e.target.result
                                const email = localStorage.getItem('email')
                                if (email && window.db) {
                                    const data = {
                                        content: parser.input.value,
                                        email,
                                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                                    }
                                    window.db.collection("documents").doc(fname).add({
                                            data
                                        })
                                        .then((docRef) => {
                                            let documents = localStorage.getItem('documents')
                                            documents = documents ? JSON.parse(documents) : []
                                            documents.push({
                                                id: fname,
                                                ...data,
                                                saved: true
                                            })
                                            localStorage.setItem("documents", JSON.stringify(documents))
                                        })
                                        .catch((error) => {
                                            console.error("Error adding document: ", error);
                                        });
                                }
                                history.pushState('', "BBCode Live Editor", "?id=" + fname)
                                parser.render()
                                modal.close()
                            });
                            reader.readAsBinaryString(myFile)
                        }
                    } else {
                        alert("File must be docx or txt")
                    }
                } else {
                    alert("File is too big :(")
                }
            }
        });
    }
}