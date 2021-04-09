window.onload = function () {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bet-protocol&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true')
        .then(response => response.json())
        .then(data => setPopup(data));
}

var button = document.querySelector("#myInputBtn");
button.addEventListener('click', function() {
    addBag();
});

function addBag() {
    let bagStr = document.getElementById("myInput").value;
    var coinSymbol = bagStr.substring(bagStr.indexOf("[")+1, bagStr.length-1);
    getCoinID(coinSymbol);
}

function addBagFromStorage(id, coinSymbol, key) {
    if (id.length > 0) {
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + id + '&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true')
            .then(response => response.json())
            .then(data => addBagElement(data, id, coinSymbol, false, key));
    }
}

function getCoinID(coinSymbol) {
    fetch('https://api.coingecko.com/api/v3/coins/list')
        .then(response => response.json())
        .then(data => getCoinIDfromList(data, coinSymbol));
}

function getCoinIDfromList(data, coinSymbol) {
    var id = "";
    coinSymbol = coinSymbol.toLowerCase();
    data.forEach(element => {
        if (element['symbol'] == coinSymbol) {
            id = element['id'];
        }
    });
    if (id.length > 0) {
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + id + '&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true')
            .then(response => response.json())
            .then(data => addBagElement(data, id, coinSymbol, true, ""));
    }
}

function addBagElement(data, id, coinSymbol, storeIt, key) {
    var price = '$ ' + data[id]['usd'].toString();
    var htmlCode = '<div class="row bag">' + 
                        '<div class="col-left"><p>' + coinSymbol.toUpperCase() + '</p></div>' + 
                        '<div class="col-price"><p>' + price + '</p></div>' +
                        '<div class="col-remove"><p>-</p></div>' +
                    '</div>';
    var coinListElement = document.querySelector("#coinList");
    var bagElement = htmlToElement(htmlCode);
    coinListElement.appendChild(bagElement);
    let removeBtn = bagElement.querySelector(".col-remove");
    // hover
    bagElement.addEventListener("mouseover", event => {
        removeBtn.setAttribute("style", "background-color: white;");
    });
    bagElement.addEventListener("mouseout", event => {
        removeBtn.setAttribute("style", "background-color: #0d0f19;");
    });
    // store bag
    if (storeIt) {
        chrome.storage.sync.get(null, function(items) {
            var size = 0;
            size = Object.keys(items).length + 1;
            var idAndSymbol = id + ":" + coinSymbol;
            chrome.storage.sync.set({[ "bag_" + size ]: idAndSymbol}, function() {
            });
            // add remove function
            addRemoveFunc([ "bag_" + size ], removeBtn, bagElement);
        });
    } else {
        // add remove function
        addRemoveFunc(key, removeBtn, bagElement);
    }
}

function addRemoveFunc(key, removeBtn, bagElement) {
    removeBtn.addEventListener('click', function() {
        bagElement.remove();
        chrome.storage.sync.remove(key, function() {
        });
    });
}

function htmlToElement(html) {
    var template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function getCoinList() {
    fetch('https://api.coingecko.com/api/v3/coins/list')
        .then(response => response.json())
        .then(data => getCoinNames(data));    
}

function getCoinNames(data) {
    var coinNames = [];
    data.forEach(element => {
        coinNames.push(element['name'] + "  [" + element['symbol'].toUpperCase() + "]");
    });
    // initiate the autocomplete function on the "myInput" element, and pass along the coinNames
    autocomplete(document.getElementById("myInput"), coinNames);
}

function setPopup(data) {
    var price = '$ ' + data['bet-protocol']['usd'].toString();
    var mcap  = '$ ' + abbreviateNumber(Math.floor(data['bet-protocol']['usd_market_cap']));
    var vol   = '$ ' + abbreviateNumber(Math.floor(data['bet-protocol']['usd_24h_vol']));
    var change  = printableNumber(data['bet-protocol']['usd_24h_change'].toFixed(2).toString()) + ' %';
    var updated = getTimeDiff(data['bet-protocol']['last_updated_at']*1000);
    document.querySelector('#price').innerHTML = price;
    document.querySelector('#mcap').innerHTML = mcap;
    document.querySelector('#volume').innerHTML = vol;
    document.querySelector('#change').innerHTML = change;
    document.querySelector('#updated').innerHTML = updated;
    getCoinList();
    getOtherBags();
}

function getOtherBags() {
    chrome.storage.sync.get(null, function(items) {
        Object.keys(items).forEach(key => {
            var id = items[key].substring(0,items[key].indexOf(":"));
            var coinSymbol = items[key].substring(items[key].indexOf(":")+1, items[key].length);
            addBagFromStorage(id, coinSymbol, key);
        });
    });
}

function printableNumber(n) { 
    return (n > 0) ? "+" + n : n;
};

function getTimeDiff(datetime) {
    var now = new Date().getTime();
    if( isNaN(datetime) ) {
        return "";
    }
    if (datetime < now) {
        var milisec_diff = now - datetime;
    } else {
        var milisec_diff = datetime - now;
    }
    var days = Math.floor(milisec_diff / 1000 / 60 / (60 * 24));
    var date_diff = new Date( milisec_diff );
    if (days == 0) {
        if (date_diff.getUTCHours() == 0) {
            if (date_diff.getMinutes() == 0) {
                return date_diff.getSeconds() + " sec ago";
            } else {
                return date_diff.getMinutes() + " min " + date_diff.getSeconds() + " sec ago";
            }
        } else {
            return date_diff.getHours() + " h " + date_diff.getMinutes() + " min " + date_diff.getSeconds() + " sec ago";
        }
    } else {
        return days + " d "+ date_diff.getHours() + " h " + date_diff.getMinutes() + " min " + date_diff.getSeconds() + " sec";
    }
}

function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "k", "m", "b","t"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

function autocomplete(inp, arr) {
    // the autocomplete function takes two arguments,
    // the text field element and an array of possible autocompleted values:
    var currentFocus;
    // execute a function when someone writes in the text field:
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        // close any already open lists of autocompleted values
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        // create a DIV element that will contain the items (values):
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        // append the DIV element as a child of the autocomplete container:
        this.parentNode.appendChild(a);
        // for each item in the array...
        for (i = 0; i < arr.length; i++) {
            // check if the item starts with the same letters as the text field value:
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            // create a DIV element for each matching element:
            b = document.createElement("DIV");
            // make the matching letters bold:
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            // insert a input field that will hold the current array item's value:
            b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
            // execute a function when someone clicks on the item value (DIV element):
            b.addEventListener("click", function(e) {
                // insert the value for the autocomplete text field:
                inp.value = this.getElementsByTagName("input")[0].value;
                // close the list of autocompleted values,
                // (or any other open lists of autocompleted values:
                closeAllLists();
            });
            a.appendChild(b);
            }
        }
    });
    // execute a function presses a key on the keyboard:
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            // If the arrow DOWN key is pressed, increase the currentFocus variable:
            currentFocus++;
            // and and make the current item more visible:
            addActive(x);
        } else if (e.keyCode == 38) { //up
            // If the arrow UP key is pressed, decrease the currentFocus variable:
            currentFocus--;
            // and and make the current item more visible:
            addActive(x);
        } else if (e.keyCode == 13) {
            // If the ENTER key is pressed, prevent the form from being submitted
            e.preventDefault();
            if (currentFocus > -1) {
            // and simulate a click on the "active" item:
            if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        // a function to classify an item as "active":
        if (!x) return false;
        // start by removing the "active" class on all items:
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        // add class "autocomplete-active":
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        // a function to remove the "active" class from all autocomplete items:
        for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        // close all autocomplete lists in the document,
        // except the one passed as an argument:
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
            x[i].parentNode.removeChild(x[i]);
        }
        }
    }
    // execute a function when someone clicks in the document:
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

// Temporary workaround for secondary monitors on MacOS where redraws don't happen
// @See https://bugs.chromium.org/p/chromium/issues/detail?id=971701
chrome.runtime.getPlatformInfo(function(info) {
  if (info.os === 'mac') {
    const fontFaceSheet = new CSSStyleSheet()
    fontFaceSheet.insertRule(`
      @keyframes redraw {
        0% {
          opacity: 1;
        }
        100% {
          opacity: .99;
        }
      }
    `)
    fontFaceSheet.insertRule(`
      html {
        animation: redraw 1s linear infinite;
      }
    `)
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      fontFaceSheet,
    ]
  }
})