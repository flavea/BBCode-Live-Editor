const themeChanger = document.getElementById('theme-changer')
const theme = {
    themeSetting: {
        theme: 'light',
        editorFont: 'Source Code Pro',
        previewFont: 'Noto Sans',
        fontSize: '16px'
    },
    switchTheme: function (palette) {
        theme.themeSetting.theme = palette
        document.querySelector("body").className = palette
        localStorage.themeSetting = JSON.stringify(theme.themeSetting)
        document.querySelectorAll('.theme-choice').forEach(e => e.classList.remove("active"))
        document.getElementById(palette).classList.add("active")
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
            let currentTheme = theme.themeSetting.theme
            if (currentTheme === 'day') {
                currentTheme = "sunset"
            } else if (currentTheme === 'night') {
                currentTheme = "dawn"
            }
            theme.switchTheme(currentTheme)
            parser.input.style.fontFamily = theme.themeSetting.editorFont
            parser.output.style.fontFamily = theme.themeSetting.previewFont
        } else {
            theme.switchTheme("light")
        }
    }
}