const states = [
    /\[/,
    /[=[\]]/,
    /\]/
]
const tagList = ['*', 'img', 'url', 'color', 'size', 'font', 'align', 'quote', 'spoiler', 'roll', 'dohtml', 'list', 'hr', 'b', 'i', 'u', 's', 'table', 'tr', 'td', 'code']
const whitelist = {
    'img': /^https?:\/\//,
    'url': /^(https?|ftps?|ircs?):\/\//,
    'color': /[A-Za-z]+|#(?:[0-9a-f]{3}){1,2}/,
    'font': '[1-14]'
}
const tagInfo = [
    ['li'],
    ['img', 'src', {
        alt: '',
        border: 0
    }],
    ['a', 'href'],
    ['font', 'color'],
    ['font', 'size'],
    ['font', 'face'],
    // align
    function (arg, content) {
        let el = document.createDocumentFragment()

        let tmp = document.createElement('div')
        tmp.style.textAlign = arg
        tmp.appendChild(parser.parse(content))

        el.appendChild(tmp)

        return el
    },
    //quote
    function (arg, content) {
        let el = document.createDocumentFragment()

        let tmp = document.createElement('blockquote')
        tmp.appendChild(parser.parse(content))

        el.appendChild(tmp)

        return el
    },

    // spoiler
    function (arg, content) {
        let el = document.createElement('div')
        let toggleImg = document.createElement('div')

        toggleImg.innerText = 'The following content will be shown as a spoiler:'
        toggleImg.classList.add('spoiler')
        el.appendChild(toggleImg)

        let spoilerDiv = document.createElement('div')
        spoilerDiv.classList.add('spoiler-content')
        spoilerDiv.appendChild(parser.parse(content))
        el.appendChild(spoilerDiv)

        return el
    },
    // dice roll
    function (arg, code) {

        let res = 0
        let message = 'dice roll error'
        const numbers = code.split('d')
        let rot = numbers[0]

        if (numbers.length === 2) {
            const plus = numbers[1].split('+')
            const minus = numbers[1].split('-')

            if (plus.length >= 2) {
                while (rot > 0) {
                    res += Math.floor(Math.random() * parseInt(plus[0])) + 1
                    rot--
                }
                res += parseInt(plus[1])
                message = `${code} = ${res}`
            } else if (minus.length >= 2) {
                while (rot > 0) {
                    res += Math.floor(Math.random() * parseInt(minus[0])) + 1
                    rot--
                }
                res -= parseInt(minus[1])
                message = `${code} = ${res}`
            } else {
                while (rot > 0) {
                    res += Math.floor(Math.random() * parseInt(numbers[1])) + 1
                    rot--
                }
                message = `${code} = ${res}`
            }
        }

        let el = document.createDocumentFragment()
        let tmp = document.createElement('b')
        tmp.appendChild(parser.parse(message))

        el.appendChild(tmp)

        return el
    },
    // html
    function (arg, code) {
        let el = document.createDocumentFragment()
        let tmp = document.createElement('div')
        tmp.innerHTML = code

        el.appendChild(tmp)

        return el
    },
    ['ul']
]

const parser = {
    input: document.getElementById('input'),
    output: document.getElementById('output'),
    words: document.getElementById('words'),
    characters: document.getElementById('characters'),
    parse: function (text) {
        let oldp = 0
        let newp = 0
        let state = 0
        let result = document.createDocumentFragment()
        let tagArr = []
        let attributeArr = []

        function addTextNode(text) {
            text.split('\n').forEach(function (content, n, arr) {
                result.appendChild(
                    document.createTextNode(content)
                )

                if (n !== arr.length - 1) {
                    result.appendChild(document.createElement('br'))
                }
            })
        }

        do {
            newp = text
                .substr(oldp)
                .search(states[state])

            let foundTag = newp !== -1
            if (foundTag) {
                newp += oldp
            } else {
                newp = text.length
            }

            let content
            let tag
            let closingTag
            let closingAttr
            let hasAttributes
            let tagIndex = -1
            let foundChar

            switch (state) {
                case 0:
                    content = text.substring(oldp, newp)

                    if (content) addTextNode(content)
                    if (foundTag) state = 1
                    break

                case 1:
                    tag = text.substring(oldp, newp)
                    tagArr.push(tag)

                    foundChar = text.charAt(newp)

                    if (foundChar === '[') {
                        addTextNode('[')
                        break
                    }

                    hasAttributes = foundChar === '='

                    if (!hasAttributes) {
                        attributeArr.push('')

                        if (tag === '*' || tag === 'hr') {
                            text = text.substr(0, newp + 1) + '[/' + tag + ']' +
                                text.substr(newp + 1)
                        }
                    }
                    state = 3 - hasAttributes
                    break

                case 2:
                    attributeArr.push(
                        text.substring(oldp, newp))

                    state = 3
                    break
            }

            oldp = newp + 1

            if (state === 3) {
                closingTag = tagArr.pop()
                closingAttr = attributeArr.pop()

                let endedStartTag = text.indexOf(']', newp)
                newp = closingTag === 'img' && closingAttr ? endedStartTag : text.indexOf('[/' + closingTag + ']', oldp)

                let openedTag
                if (newp === -1) {
                    newp = text.length
                    openedTag = true
                } else {
                    tagIndex = tagList.indexOf(closingTag)
                }

                content = text.substring(oldp, newp)

                if (tagIndex === -1) {
                    addTextNode('[' + closingTag + (closingAttr ? ('=' + closingAttr) : '') + (endedStartTag === -1 ? '' : ']'))
                    if (content) {
                        result.appendChild(parser.parse(content))
                    }
                    if (!openedTag) {
                        addTextNode('[/' + closingTag + ']')
                    }
                } else if (typeof tagInfo[tagIndex] === 'function') {
                    result.appendChild(tagInfo[tagIndex](closingAttr, content))
                } else {
                    let info = tagInfo[tagIndex] || []
                    let el = document.createElement(
                        info[0] || closingTag
                    )

                    let attributes = info[2]
                    if (attributes) {
                        for (let i in attributes) {
                            if (attributes.hasOwnProperty(i)) {
                                el.setAttribute(i, attributes[i])
                            }
                        }
                    }

                    let whitelistConfig = whitelist[closingTag]
                    let attribute

                    if (closingTag === 'img') {
                        attribute = closingAttr || content

                        if (!whitelistConfig || whitelistConfig.test(attribute)) {
                            el.setAttribute(info[1], attribute)
                        } else {
                            el = document.createTextNode('')
                        }
                    } else if (closingTag === 'url') {
                        attribute = closingAttr || content

                        if (!whitelistConfig || whitelistConfig.test(attribute)) {
                            el.setAttribute(info[1], attribute)
                            el.appendChild(parser.parse(content))
                        } else {
                            el = document.createTextNode('')
                        }
                    } else if (info[1]) {
                        el.setAttribute(info[1], closingAttr)
                        el.appendChild(parser.parse(content))
                    } else {
                        el.appendChild(parser.parse(content))
                    }
                    result.appendChild(el)
                }

                oldp = endedStartTag === -1 || openedTag ? text.length : text.indexOf(']', newp) + 1
                state = 0
            }
        } while (oldp < text.length)

        switch (state) {
            case 1:
                addTextNode('[')
                break
            case 2:
                addTextNode('[' + tagArr.pop())
                break
            case 3:
                addTextNode('[' + tagArr.pop() + '=' + attributeArr.pop())
                break
        }

        return result
    },
    smartSymbols: function () {
        let str = parser.input.value.replace('--', '—').replace('...', '…')
        str = str.replace(/(^')|((([\s{\[\(>]')|([\s>]"'))(?!([^<])*?>)(?!<script[^>]*?>)(?![^<]*?<\/script>|$))/gi,
            function ($1$2) {
                return $1$2.replace(/'/g, "\u2018");
            }
        )

        str = str.replace(/'(?!([^<])*?>)(?!<script[^>]*?>)(?![^<]*?<\/script>|$)/gi, "\u2019")

        str = str.replace(/(^")|((([\s{\[\(>]")|([\s>]'"))(?!([^<])*?>)(?!<script[^>]*?>)(?![^<]*?<\/script>|$))/gi,
            function ($1$2) {
                return $1$2.replace('"', "\u201c");
            }
        )

        str = str.replace(/"(?!([^<])*?>)(?!<script[^>]*?>)(?![^<]*?<\/script>|$)/g, "\u201d");

        return str
    },
    render: function (type) {
        let id = 'draft-' + parser.uuid()
        const url = new URLSearchParams(window.location.search)
        const drafts = Object.keys(localStorage).filter(draft => draft.startsWith('draft-'))
        if (url.has('id')) {
            id = url.get('id')
            if (typeof type === 'boolean') {
                parser.input.value = localStorage.getItem(id)
                parser.input.value = parser.smartSymbols()
            }
        }
        else if (drafts.length > 0) {
            id = drafts[0]
            if (typeof type === 'boolean') {
                parser.input.value = localStorage.getItem(id)
                parser.input.value = parser.smartSymbols()
            }
        }
        const selection = parser.input.selectionEnd
        const initialInput = parser.input.value.length
        const content = parser.input.value = parser.smartSymbols()
        const result = parser.parse(content.trim())
        parser.input.selectionEnd = selection + (parser.input.value.length - initialInput)
        parser.output.innerHTML = ''
        parser.output.appendChild(result)
        // hack for lists
        parser.output.innerHTML = parser.output.innerHTML.replace(/<li><\/li>/g, '<li>');
        const text = parser.output.innerText
        parser.characters.innerText = text.length
        parser.words.innerText = parser.output.innerText.split(' ').length

        localStorage.setItem(id, content)
        history.pushState('', "BBCode Live Editor", "?id=" + id)
        if (typeof type === 'object') editor.setDrafts(true)
    },
    uuid: function () {
        return (Object.keys(localStorage).filter(draft => draft.startsWith('draft-')).length + 1) + '-' + ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
    },
    init: function () {
        const url = new URLSearchParams(window.location.search)
        if (localStorage && localStorage.content && localStorage.content != '') {
            const id = 'draft-' + parser.uuid()
            parser.input.value = localStorage.content
            localStorage.setItem(id, parser.input.value)
        } else if (url.has('id')) {
            const id = url.get('id')
            parser.input.value = localStorage.getItem(id)
            history.replaceState('', "BBCode Live Editor", "?id=" + id)
        }
        
        localStorage.removeItem('content')

        parser.input.oninput = parser.render

        let inputScrollSync = false
        let outputScrollSync = false

        parser.input.onscroll = function () {
            if (!inputScrollSync) {
                outputScrollSync = true
                parser.output.scrollTop = this.scrollTop
            }
            inputScrollSync = false
        }

        parser.output.onscroll = function () {
            if (!outputScrollSync) {
                inputScrollSync = true
                parser.input.scrollTop = this.scrollTop
            }
            outputScrollSync = false
        }

        parser.render(true)
    }
}