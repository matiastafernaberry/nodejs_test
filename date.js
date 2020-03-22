function getDate(login=false) {
	var d = new Date(),
    	month = '' + (d.getMonth() + 1),
    	day = '' + d.getDate(),
    	year = d.getFullYear();
    if (login){
    	d.setSeconds( d.getSeconds() + 3600 );	
    }
    

  	if (month.length < 2) 
    	month = '0' + month;
	if (day.length < 2) 
    	day = '0' + day;

    var dateNow = year+'-'+month+'-'+day+'T'+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();

    return dateNow;
}


module.exports.getDate = getDate;