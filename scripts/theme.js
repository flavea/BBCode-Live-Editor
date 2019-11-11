const themeChanger = document.getElementById('theme-changer')
const theme = {
    themeSetting: {
        theme: 'day',
        editorFont: 'Source Code Pro',
        previewFont: 'Noto Sans',
        fontSize: '16px'
    },
    switchTheme: function () {
        if (themeChanger.checked) {
            theme.themeSetting.theme = "day"
            document.querySelector("body").classList.add('day')
            document.querySelector("body").classList.remove('night')
        } else {
            theme.themeSetting.theme = "night"
            document.querySelector("body").classList.add('night')
            document.querySelector("body").classList.remove('day')
        }
        localStorage.themeSetting = JSON.stringify(theme.themeSetting)
    },
    changeFont: function(type, value) {
        if (type === 'editor') {
            parser.input.style.fontFamily = theme.themeSetting.editorFont = value
        }
        if (type === 'preview') {
            parser.output.style.fontFamily = theme.themeSetting.editorFont = value
        }
        if (type === 'size') {
            parser.output.style.fontSize = parser.input.style.fontSize = theme.themeSetting.fontSize = value
        }
        localStorage.themeSetting = JSON.stringify(theme.themeSetting)
    },
    init: function () {
        if (localStorage && localStorage.themeSetting) {
            theme.themeSetting = JSON.parse(localStorage.themeSetting)
            if (theme.themeSetting.theme === 'day') {
                themeChanger.checked = true
                document.querySelector("body").classList.add('day')
                document.querySelector("body").classList.add('night')
            } else {
                themeChanger.checked = false
                document.querySelector("body").classList.add('night')
                document.querySelector("body").classList.add('day')
            }
            parser.input.style.fontFamily = theme.themeSetting.editorFont
            parser.output.style.fontFamily = theme.themeSetting.previewFont
        }
        
        themeChanger.addEventListener('change', theme.switchTheme, false)
    }
}