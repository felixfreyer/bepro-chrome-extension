window.onload = function () {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bet-protocol&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true')
        .then(response => response.json())
        .then(data => setPopup(data));

    function setPopup(data) {
        var price = '$ ' + data['bet-protocol']['usd'].toString();
        var mcap  = '$ ' + abbreviateNumber(Math.floor(data['bet-protocol']['usd_market_cap']));
        var vol  = '$ ' + abbreviateNumber(Math.floor(data['bet-protocol']['usd_24h_vol']));
        var change = printableNumber(data['bet-protocol']['usd_24h_change'].toFixed(2).toString()) + ' %';
        var updated = getDateString(data['bet-protocol']['last_updated_at']);
        
        document.querySelector('#price').innerHTML = price;
        document.querySelector('#mcap').innerHTML = mcap;
        document.querySelector('#volume').innerHTML = vol;
        document.querySelector('#change').innerHTML = change;
        document.querySelector('#updated').innerHTML = updated;
    }

    function printableNumber(n) { 
        return (n > 0) ? "+" + n : n;
    };

    function getDateString(timestamp) {
        timestampStr = timestamp.toString();
        var newDate = new Date();
        newDate.setTime(timestampStr*1000);
        dateString = newDate.toUTCString();
        return dateString;
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
}