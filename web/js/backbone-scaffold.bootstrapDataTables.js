$.bbscaffoldBootstrapDataTablesTemplates = {
    scaffold: '<div class="bbs-scaffold"> \
            <ul class="bbs-modelMenu nav navbar-nav" style="display: none"></ul></div> \
    	<div class="bbs-loading">Loading...</div>\
        <div class="bbs-models" style="clear:both"    ></div> \
     </div>',
    modelListTableActions: '<td><button class="bbs-edit btn">edit</button></td> \
      <td><button class="bbs-delete btn">delete</button> \
    </td>',
    model: '<div class="bbs-model bbs-model-<%- name %>" style="display: none"> \
      <h1 class="bbs-modelHeader"><%- label %></h1> \
      <div class="bbs-modelSubSections"> \
         <div class="bbs-modelList bbs-modelSubSection"> \
            <div class="bbs-modelAddNew" style="margin-bottom: 10px"> \
               <button class="bbs-addNew btn btn-primary">add new</button> \
            </div> \
         </div> \
         <div class="bbs-modelEdit bbs-modelSubSection"></div> \
         <div class="bbs-modelDetail bbs-modelSubSection"></div> \
      </div> \
   </div>',
   modelListTable: '<table class="bbs-modelListTable table table-striped"><thead><th width="50px">&#160</th><th width="50px">&#160</th> \
      <% for(columnName in columns) { if (columns[columnName].listDisplayView != "none") { %> \
      <th><%- columns[columnName].label %></th> \
   <% }} %> \
   </thead><tbody></tbody></table>',
   modelEditActions: '<div class="bbs-editActions" style="margin-top: 20px"> \
      <button class="bbs-save btn btn-primary">save</button> \
      <button class="bbs-cancel btn">cancel</button> \
   </div>',
   modelEditRemoveRelated: '<a class="bbs-delete btn btn-mini" style="cursor: pointer">remove</a>',
   modelEditAddRelated: '<a class="bbs-addRelated btn btn-mini" style="cursor: pointer">add</a>'
  };