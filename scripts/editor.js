const editor = {
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
                const color = document.getElementById('color').value
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
                    name[i] = name[i][0].toUpperCase() + name[i].slice(1)
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
    init: function () {
        document.onkeyup = editor.shortcuts
        editor.fetchMembers()
    }
}