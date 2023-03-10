setInterval(() => {
    if (document.querySelector("[aria-roledescription=\"map\"]") && !document.querySelector("[aria-roledescription=\"map\"]").className.match(/\bmap\b/)) {
        document.querySelector("[aria-roledescription=\"map\"]").classList.add("map")
        document.querySelector("[aria-roledescription=\"map\"]").style.filter = "grayscale(60%) brightness(1.9) contrast(1.9)";
    }
    
    if (document.getElementsByClassName("report-maps")[0].children[1] !== undefined) {
        document.getElementsByClassName("report-maps")[0].children[1].remove()
    }
}, 500)