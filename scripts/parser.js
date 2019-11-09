const input = document.getElementById('input')
const output = document.getElementById('output')
const words = document.getElementById('words')
const characters = document.getElementById('characters')
const themeChanger = document.getElementById('theme-changer')

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
        tmp.appendChild(parse(content))

        el.appendChild(tmp)

        return el
    },
    //quote
    function (arg, content) {
        let el = document.createDocumentFragment()

        let tmp = document.createElement('blockquote')
        tmp.appendChild(parse(content))

        el.appendChild(tmp)

        return el
    },

    // spoiler
    function (arg, content) {
        let el = document.createElement('div')
        el.textContent = (arg || 'Spoiler') + ' '
        let toggleImg = document.createElement('img')

        toggleImg.src = 'images/plus.gif'
        toggleImg.title = 'Spoiler'
        toggleImg.alt = ''
        el.appendChild(toggleImg)

        let spoilerDiv = document.createElement('div')
        spoilerDiv.appendChild(parse(content))
        spoilerDiv.style.display = 'none'
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
        tmp.appendChild(parse(message))

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

const switchTheme = (theme) => {
    if (themeChanger.checked) {
        localStorage.theme = "day"
        document.querySelectorAll("body").forEach(_element => {
            _element.classList.add('day')
            _element.classList.remove('night')
        })
    } else {
        localStorage.theme = "night"
        document.querySelectorAll("body").forEach(_element => {
            _element.classList.add('night')
            _element.classList.remove('day')
        })
    }
}

const parse = (text) => {
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
                    result.appendChild(parse(content))
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
                        el.appendChild(parse(content))
                    } else {
                        el = document.createTextNode('')
                    }
                } else if (info[1]) {
                    el.setAttribute(info[1], closingAttr)
                    el.appendChild(parse(content))
                } else {
                    el.appendChild(parse(content))
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
}

const apply = (code, type = null) => {
    let input = document.getElementById('input')
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
            before = '[/code]'
            after = '[code]'
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
        input.focus()
        document.selection.createRange().text = before + document.selection.createRange().text + after
    } else if (input.selectionStart || input.selectionStart == '0') {
        let startPos = input.selectionStart
        let endPos = input.selectionEnd
        input.value = input.value.substring(0, startPos) + before + input.value.substring(startPos, endPos) + after + input.value.substring(endPos, input.value.length)
        input.selectionStart = startPos + before.length
        input.selectionEnd = endPos + before.length
        input.focus()
    }
    render()
}

const showMention = () => {
    const shownStatus = document.getElementById('mentions').style.display
    if (shownStatus === 'block') {
        document.getElementById('mentions').style.display = "none"
    } else {
        document.getElementById('mentions').style.display = "block"
        fetchMembers()
    }
}

const fetchMembers = (forum = 'eleftheria') => {
    const members = document.getElementById('members')
    members.innerHTML = 'Loading...'
    let url = ''
    if (forum === 'eleftheria') url = 'https://rp.prosa.id/emembers?_limit=9999&_sort=Name:ASC'
    fetch(url).then(function (response) {
        if (response.ok) {
            return response.json();
        } else {
            return Promise.reject(response);
        }
    }).then(function (data) {
        members.innerHTML = ''
        data.forEach(member => {
            let name = member.Name.toLowerCase().split(' ')
            for (var i = 0; i < name.length; i++) {
                name[i] = name[i][0].toUpperCase() + name[i].slice(1);
            }
            name = name.join(' ')
            members.innerHTML += `<option value="${name}">${name}</option>`
        })
    }).catch(function (err) {
        console.warn('Something went wrong.', err);
    });
}

const render = () => {
    localStorage.content = input.value.trim()
    const result = parse(input.value.trim())
    output.innerHTML = ''
    output.appendChild(result)
    const text = output.innerText
    characters.innerText = text.length
    words.innerText = output.innerText.split(' ').length
}

if (localStorage && localStorage.theme) {
    if (localStorage.theme === 'day') {
        themeChanger.checked = true
        document.querySelectorAll("body").forEach(_element => {
            _element.classList.add('day')
            _element.classList.remove('night')
        })
    } else {
        themeChanger.checked = false
        document.querySelectorAll("body").forEach(_element => {
            _element.classList.add('night')
            _element.classList.remove('day')
        })
    }
}

if (localStorage && localStorage.content) {
    input.value = localStorage.content
}

render()
themeChanger.addEventListener('change', switchTheme, false)
input.oninput = render

let inputScrollSync = false
let outputScrollSync = false

input.onscroll = function () {
    if (!inputScrollSync) {
        outputScrollSync = true
        output.scrollTop = this.scrollTop
    }
    inputScrollSync = false
}

output.onscroll = function () {
    if (!outputScrollSync) {
        inputScrollSync = true
        input.scrollTop = this.scrollTop
    }
    outputScrollSync = false
}

var data = null;

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
        console.log(this.responseText);
    }
});
