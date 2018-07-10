var admin = require("firebase-admin");
var fs = require('fs'),
    csv = require('csv-stream');
var serviceAccount = require("./dbkey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://order-bom.firebaseio.com'
});

fs.readdirSync('./temp').forEach(filename => {
  if (fs.lstatSync('./temp/' + filename).isDirectory()){
    return;
  }
  console.log("Reading File: " + filename);
  var options = {
    delimiter : ' ', // default is ,
    endLine : '\n', // default is \n,
    columns : ['inEntity', 'orderNo','lineNo','subLineNo','bmSeq','parentPart','component','compQty',
               'indentStr','dimQty','dimInst','dimension1','dimension2','dimension3','dimension4',
               'dimension5','dimension6','dimension7','dimension8','dimension9','dimension10','orderPart',
               'cumIndentStr','attrStr','resstr','yieldOverride','finalPart','manualBom','finalAssy','finabmSeq',
               'finalMatchAttr','applDesc','machineDesc','loosePart','looseQty','mfgNotes1','mfgNotes2','mfgNotes3',
               'mfgNotes4','mfgNotes5','mfgNotes6','mfgNotes7','mfgNotes8','mfgNotes9','mfgNotes10','mfgNotes11',
               'mfgNotes12','mfgNotes13','mfgNotes14','mfgNotes15','mfgNotes16','prodDate','orderStatus','currCost1',
               'currCost2','currCost3','currCost4','currCost5','currCost6','currCost7','currCost8'], // by default read the first line and use values found as columns
    columnOffset : 0, // default is 0
    escapeChar : '', // default is an empty string
    enclosedChar : '"' // default is an empty string
  };
  var size = 0;
  var db = admin.firestore();
  var ref;
  var batch;
  var csvStream = csv.createStream(options);
  var commitOnEnd = true;
  fs.createReadStream('./temp/' + filename).pipe(csvStream)
    .on('error',function(err){
      console.error(err);
    })
    .on('data',function(data){
      // outputs an object containing a set of key/value pair representing a line found in the csv file.
      size++;
      //data = lowerCase(data);
      data['inEntityLC'] = data['inEntity'].toLowerCase();
      data['parentPartLC'] = data['parentPart'].toLowerCase();
      data['componentLC'] = data['component'].toLowerCase();
      data['orderPartLC'] = data['orderPart'].toLowerCase();
      //console.log(data);
      if(size === 1){
        batch = db.batch();
      }
      //console.log(data);
      ref = db.collection("OrderBom").doc();
      batch.set(ref,data);
      commitOnEnd = true;
      if(size === 400){
        size = 0;
        commitOnEnd = false;
        batch.commit().catch(error => {
          console.log(error);
        });
      }
    })
    .on('column',function(key,value){          
      // outputs the column name associated with the value found
      //console.log('#' + key + ' = ' + value);
    })
    .on("end", function(){
      if(commitOnEnd){
        batch.commit().catch(error => {
          console.log(error);
        });
      }
      size = 0;    
      fs.rename('./temp/' + filename, './temp/uploaded/' + filename, (err) => {
        if (err) throw err;
        console.log('Rename complete!');
      }); 
  });
});

/*function SaveData(data,size){
  var db = admin.firestore();
  var ref = db.collection("OrderBom").doc();
  console.log(size);
  if(size === 1){
    var batch = db.batch();
  }
  batch.set(ref,data);
  if(size === 400){
    //console.log("change batch");
    batch.commit().catch(error => {
      console.log(error);
    });
  }
  /*for (var i = 0; i < data.length; i++) {
    var createBatch = false;
    if(batchCount === 0 || createBatch){
      var batch = db.batch();
    }
    batchCount++;
    //console.log('batchCount: ', batchCount + "i: " + i);
    batch.set(ref,data[i]);
    if(batchCount === 100 || i === data.length-1){
      //console.log("change batch");
      createBatch = true;
      batchCount = 0;
      batch.commit().catch(error => {
        console.log(error);
      });
    }
  */  
    /*db.collection("OrderBom").add(data[i]).then(ref => {
      console.log('Added document with ID: ', ref.id);
    })
    .catch(error => {
      console.log(error);
    });*/
 // }
//}
