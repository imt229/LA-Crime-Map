
console.log("Javascript linked!");
var view;
require([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/FeatureLayer"
    ], function(Map, MapView, FeatureLayer) {

    var map = new Map({
      basemap: "topo-vector"
    });

    view = new MapView({
      container: "viewDiv",
      map: map,
      center: [-118.2437, 34.0522], // longitude, latitude
      zoom: 10
    });

    var areaOutlines = new FeatureLayer({
        url:
          "https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LAPD_Division/FeatureServer/0/query?where=APREC%20%3D%20'MISSION'&outFields=*&outSR=4326&f=json",
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-line",
            color: "#6c5b7b",
            width: "2px"
          }
        }

      });

    var areaFill = new FeatureLayer({
        url:
          "https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LAPD_Division/FeatureServer/0/query?where=APREC%20%3D%20'MISSION'&outFields=*&outSR=4326&f=json",
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-fill",
            color: "#c06c84",
          }
        },
        opacity: 0.5,
        outFields: ["*"],
        popupTemplate: {  // Enable a popup
           title:  "{APREC}", // Show attribute value
           content: "PREC: {PREC} </br> Area: {AREA} miles squared"  // Display in pop-up
         }
      });

    map.add(areaFill);
    map.add(areaOutlines);

  });



//Display Crime Options
var displayCrimeType = false;
document.querySelector(".optionHeaderWrapper").addEventListener("click", () =>{
  var crimeForm = document.querySelector("#crimeOptions");
  if (displayCrimeType){
    crimeForm.style.display = "none";
    crimeForm.style.height = "0px";
    crimeForm.style.opacity = "0%";
    document.querySelector("#crimeArrow").style.transform = "rotateZ(180deg)";
    displayCrimeType = false;
  } else {
    crimeForm.style.display = "block";
    crimeForm.style.height = "100%";
    crimeForm.style.opacity = "100%";
    crimeForm.style.transform = "translateY(0)";
    displayCrimeType = true;
    document.querySelector("#crimeArrow").style.transform = "rotateZ(270deg)";
  }
})

var crimeTypeSelection = document.getElementsByName("crimeType");
for (let i = 0; i < crimeTypeSelection.length; i++){
  crimeTypeSelection[i].addEventListener("click", crimeSelectionChange);
}  

function crimeSelectionChange(){
  for (let i = 0; i < crimeTypeSelection.length; i++){
    if (crimeTypeSelection[i].checked){
      document.querySelector(".currentlySelected").innerHTML = crimeTypeSelection[i].value;
      console.log(crimeTypeSelection[i])
      break;
    }
  }
}
