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
                before = '[url=URL]'
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
            case 'mention':
                before = `@[${document.getElementById('members').value}`
                after = ']'
                break
        }
        document.querySelectorAll('#buttons select').forEach(el => el.value = 0);
        if (document.selection) {
            parser.input.focus()
            document.selection.createRange().text = before + document.selection.createRange().text + after
        } else if (parser.input.selectionStart || parser.input.selectionStart == '0') {
            let startPos = parser.input.selectionStart
            let endPos = parser.input.selectionEnd
            parser.input.value = parser.input.value.substring(0, startPos) + before + parser.input.value.substring(startPos, endPos) + after + parser.input.value.substring(endPos, parser.input.value.length)
            parser.input.selectionStart = startPos + before.length
            parser.input.selectionEnd = endPos + before.length
            parser.input.focus()
        }
        parser.render()
    },
    showMention: function () {
        const shownStatus = document.getElementById('mentions').style.display
        if (shownStatus === 'block') {
            document.getElementById('mentions').style.display = "none"
        } else {
            document.getElementById('mentions').style.display = "block"
        }
    },
    fetchMembers: function (forum = 'eleftheria') {
        const members = document.getElementById('members')
        members.innerHTML = 'Loading...'
        let url = ''
        if (forum === 'eleftheria') url = 'https://rp.prosa.id/emembers?_limit=9999&_sort=Name:ASC'
        fetch(url).then(function (response) {
            if (response.ok) {
                return response.json()
            } else {
                return Promise.reject(response)
            }
        }).then(function (data) {
            members.innerHTML = ''
            data.forEach(member => {
                let name = member.Name.toLowerCase().split(' ')
                for (var i = 0; i < name.length; i++) {
                    if (name[i].length <= 2) {
                        name[i] = name[i][0].toUpperCase() + name[i][1].toUpperCase() + name[i].slice(2)
                    } else {
                        name[i] = name[i][0].toUpperCase() + name[i].slice(1)
                    }
                }
                name = name.join(' ')
                members.innerHTML += `<option value="${name}">${name}</option>`
            })
        }).catch(function (err) {
            console.warn('Something went wrong.', err)
        })
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
    new: function () {
        let id = 'draft-' + parser.uuid()
        parser.output.innerHTML = parser.input.value = ''
        editor.open(id)
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
        const drafts = Object.keys(localStorage).filter(draft => draft.startsWith('draft-'))

        if(confirm('Are you sure you want to delete this draft?')) {
            localStorage.removeItem(key)

            if (drafts.length === 1) {
                editor.new()
            } else if (url.get('id') === key) {
                const temp = drafts.filter(d => d != key)[0]
                parser.input.value = localStorage.getItem(temp)
                history.pushState('', "BBCode Live Editor", "?id=" + temp)
            }
            parser.render({})
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
    setDrafts: function (typing = false) {
        if (typing) document.getElementById('drafts-list').innerHTML = ''
        const drafts = Object.keys(localStorage).filter(draft => draft.startsWith('draft-'))
        drafts.forEach((draft, i) => {
            const selector = document.getElementById('drafts-list')
            const curr = selector.innerHTML
            const data = {
                key: draft,
                content: localStorage.getItem(draft).substring(0, 100)+'...'
            }
            const html = `<div class="draft"><div>${data.content}</div><button onclick="editor.open('${data.key}')">Open</button> <button class="delete" onclick="editor.delete('${data.key}')"><i class="fas fa-trash"></i> Delete</button></div>`
            selector.innerHTML = curr + html
        })
    },
    init: function () {
        document.onkeyup = editor.shortcuts
        editor.fetchMembers()
        editor.setDrafts()
        editor.file.addEventListener("change", function () {
            if (this.files && this.files[0]) {
                var myFile = this.files[0];
                if (myFile.size < 100000) {
                    const filename = myFile.name.split('.')
                    if (['docx', 'txt'].includes(filename[filename.length - 1])) {
                        var reader = new FileReader();
                        let fname = filename[0]
                        if (!fname.startsWith('draft')) {
                            fname = 'draft-' + fname
                        }
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
                                    parser.render()
                                    modal.close()
                                })
                            });
                            reader.readAsArrayBuffer(myFile);
                        } else if (filename[filename.length - 1].includes('txt')) {
                            reader.addEventListener('load', function (e) {
                                parser.input.value = e.target.result
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