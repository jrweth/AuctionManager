(function($) {
/*
 * Function: fnGetColumnData
 * Purpose:  Return an array of table values from a particular column.
 * Returns:  array string: 1d data array 
 * Inputs:   object:oSettings - dataTable settings object. This is always the last argument past to the function
 *           int:iColumn - the id of the column to extract the data from
 *           bool:bUnique - optional - if set to false duplicated values are not filtered out
 *           bool:bFiltered - optional - if set to false all the table data is used (not only the filtered)
 *           bool:bIgnoreEmpty - optional - if set to false empty values are not filtered from the result array
 * Author:   Benedikt Forchhammer <b.forchhammer /AT\ mind2.de>
 */
$.fn.dataTableExt.oApi.fnGetColumnData = function ( oSettings, iColumn, bUnique, bFiltered, bIgnoreEmpty ) {
    // check that we have a column id
    if ( typeof iColumn == "undefined" ) return new Array();
    
    // by default we only wany unique data
    if ( typeof bUnique == "undefined" ) bUnique = true;
    
    // by default we do want to only look at filtered data
    if ( typeof bFiltered == "undefined" ) bFiltered = true;
    
    // by default we do not wany to include empty values
    if ( typeof bIgnoreEmpty == "undefined" ) bIgnoreEmpty = true;
    
    // list of rows which we're going to loop through
    var aiRows;
    
    // use only filtered rows
    if (bFiltered == true) aiRows = oSettings.aiDisplay; 
    // use all rows
    else aiRows = oSettings.aiDisplayMaster; // all row numbers

    // set up data array    
    var asResultData = new Array();
    
    for (var i=0,c=aiRows.length; i<c; i++) {
        iRow = aiRows[i];
        var aData = this.fnGetData(iRow);
        var sValue = aData[iColumn];
        
        
        // ignore empty values?
        if (bIgnoreEmpty == true && sValue == undefined) continue;
        if (bIgnoreEmpty == true && sValue.length == 0) continue;

        // ignore unique values?
        else if (bUnique == true && jQuery.inArray(sValue, asResultData) > -1) continue;
        
        // else push the value onto the result data array
        else { asResultData.push(sValue); }
    }
    
    return asResultData;
}

$.fn.dataTableExt.oApi.fnResetAllFilters = function (oSettings, bDraw/*default true*/) {
    for(iCol = 0; iCol < oSettings.aoPreSearchCols.length; iCol++) {
            oSettings.aoPreSearchCols[ iCol ].sSearch = '';
    }
    oSettings.oPreviousSearch.sSearch = '';

    if(typeof bDraw === 'undefined') bDraw = true;
    if(bDraw) this.fnDraw();
}

$.fn.dataTableExt.oApi.fnGetColumnFilterTextArray = function(oSettings, columnNames) {
    var sFilterTextArray = new Array();
    for(iCol = 0; iCol < oSettings.aoPreSearchCols.length; iCol++) {
       if(oSettings.aoPreSearchCols[ iCol ].sSearch) {
           sFilterTextArray.push(columnNames[iCol] + '=' + oSettings.aoPreSearchCols[ iCol ].sSearch);
       }
    }
    return sFilterTextArray;
}

$.fn.dataTableExt.oApi.fnGetColumnFilterText = function(oSettings, columnNames) {
    var sFilterTextArray = new Array();
    var sFilterText = '';
    for(iCol = 0; iCol < oSettings.aoPreSearchCols.length; iCol++) {
       if(oSettings.aoPreSearchCols[ iCol ].sSearch) {
           sFilterTextArray.push(columnNames[iCol] + '=' + oSettings.aoPreSearchCols[ iCol ].sSearch);
       }
    }
    if (sFilterTextArray.length>0) {
        sFilterText = '<div><span class="advancedFilterTitle">Advanced Filter: </span>';
        var liTag  = '<li class="advancedFilterColumnText">'
        sFilterText +=  '<ul>' + liTag + sFilterTextArray.join('</li>' + liTag) + '</li></ul></div>';
    }
    return sFilterText;
}

}(jQuery));


function fnCreateSelect( aData, selected )
{   
    if (typeof selected == "undefined") {
        selected = '';
    }
    aData.sort();
    var r='<select><option value="">All...</option>';
    var iLen=aData.length;
    for (var i=0 ; i<iLen ; i++ )
    {
        if (aData[i] == selected) {
            r += '<option value="'+aData[i]+'" selected="selected">'+aData[i]+'</option>';
        }
        else {
            r += '<option value="'+aData[i]+'">'+aData[i]+'</option>';
        }
    }
    
    return r+'</select>';
}

/**
 * 
 * @param  id       Unique ID for the filter control group
 * @param  label    label for the control group
 * 
 * @returns {String}
 */
function fnCreateFilterContainer(id, label) {
    
    return '<div class="control-group" id="filterControlGroup_' + id + '"> \
        <label class="control-label" for="filter_' + id + '">' + label + '</label> \
        <span class="controls" id="filterControl_' + id +'"></span> \
    </div>';
}

/**
 * 
 * @param iColumn  index of the column 
 * @param options  type of index to select
 */
function fnCreateFilter(dataTable, filterParentId, iColumn, options) {

    var filterId = dataTable.attr('id') + '_' + iColumn;
    if(options == undefined) options = {'filterType': 'text', 'name': 'filter'};
    if(options.filterType == undefined) options.filterType = 'text';

    if(typeof dataTable.dataTableSettings[0].aoPreSearchCols[iColumn] == "undefined") {
        var filterValue = '';
    }
    else {
        var filterValue= dataTable.dataTableSettings[0].aoPreSearchCols[iColumn].sSearch;
    }
    $('#' + filterParentId).append(fnCreateFilterContainer(filterId, options.name));
    
    if(options.filterType == 'text') {
        $('#filterControl_' + filterId).html('<input type="text" value="' + filterValue + '" id="filter_' + filterId +'" placeholder="type any part of ' + options.name + '" />');

        $("#filter_" + filterId).keyup( function () {
            /* Filter on the column (the index) of this element */
            dataTable.fnFilter( this.value, iColumn);
        } );
    }
    else if(options.filterType == 'select') {
        $('#filterControl_' + filterId).html(fnCreateSelect(dataTable.fnGetColumnData(iColumn, true, false), filterValue));
        $('#filterControl_' + filterId + ' select').change( function () {
            dataTable.fnFilter( $(this).val(), iColumn);
        } );
    }
}
