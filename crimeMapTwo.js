console.log("Javascript linked!");
var areaFill;
var areaOutlines;
var map;
var view;
var graphicsLayer;
var heatMap;
var crimeData;
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/CSVLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic"
], function (Map, MapView, FeatureLayer, CSVLayer, GraphicsLayer, Graphic) {
  var areaUrl = "https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LAPD_Division/FeatureServer/0/query?where=APREC%20%3D%20'MISSION'&outFields=*&outSR=4326&f=json"
  //var crimeDataUrl = "https://services9.arcgis.com/2ynJbr9BE17vXxR8/arcgis/rest/services/arrest_data_from_2010_to_2019/FeatureServer"
  var crimeDataUrl = "https://services9.arcgis.com/2ynJbr9BE17vXxR8/arcgis/rest/services/crimemaptwofixed/FeatureServer"

  var areaLabels = {
    symbol: {
      type: "text",
      color: "#3d6da2",
      haloColor: "#FFFFFF",
      haloSize: "0.5px",
      font: {
        size: "10px",
        family: "Noto Sans",
        weight: "bold"
      }
    },
    labelPlacement: "always-horizontal",
    labelExpressionInfo: {
      expression: "$feature.APREC"
    }
  };

  map = new Map({
    //basemap: "topo-vector"
    basemap: "gray-vector"
  });

  view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-118.2437, 34.0522], // longitude, latitude
    zoom: 9.5
  });

  areaOutlines = new FeatureLayer({
    url: areaUrl,
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-line",
        color: "#FFC300",
        width: "2px",
      }
    },
    id: "outline"

  });

  areaFill = new FeatureLayer({
    url: areaUrl,
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: "#571845",
      }
    },
    opacity: 0,
    outFields: ["*"], //Put all fields as outfields
    popupTemplate: {  // Enable a popup
      title: "{APREC}", // Show attribute value
      content: "PREC: {PREC} </br> Area: {AREA} miles squared"  // Display in pop-up
    },
    labelingInfo: [areaLabels],
    id: "fill"
  });

  const colors = ["#4e4400", "#7a6a00", "#a79100", "#d3b700", "#ffdd00"];
  const heatMapColors = ["#d9351a", "#ffc730", "#144d59", "#2c6954", "#ed9310", "#8c213f", "#102432", "#a64f1b", "#18382e", "#661510", "#b31515", "#4a0932"];
  heatMap = new FeatureLayer({
    url: crimeDataUrl,
    renderer: {
      type: "heatmap",
      colorStops: [
        { color: "rgba(63, 40, 102, 0)", ratio: 0 },
        { color: "#4e4400", ratio: 0.2 },
        { color: "#7a6a00", ratio: 0.4},
        { color: "#a79100", ratio: 0.6},
        { color: "#d3b700", ratio: 0.8},
        { color: "#ffdd00", ratio: 1 }
      ],
      maxPixelIntensity: 25,
      minPixelIntensity: 0
    },
  });

  graphicsLayer = new GraphicsLayer({
    opacity: 0.75
  });


  map.add(areaFill);
  map.add(areaOutlines);
  map.add(graphicsLayer);

  const template = {
    title: "1",
    content: "Magnitude hit on."
  };

  view.ui.move("zoom", "bottom-right");


  crimeData = new FeatureLayer(crimeDataUrl);


  var currentStartDate = '01/01/2020';
  var currentEndDate = '09/30/2020';
  var currentCrimeType = '';
  heatMap.definitionExpression = `Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}'`;
  createAreaMap();


  function createAreaMap() {
    graphicsLayer.removeAll;
    document.querySelector("#rangeOneNumbers").innerHTML = "Calculating"; 
    document.querySelector("#rangeTwoNumbers").innerHTML = "Calculating"; 
    document.querySelector("#rangeThreeNumbers").innerHTML = "Calculating"; 
    document.querySelector("#rangeFourNumbers").innerHTML = "Calculating"; 
    document.querySelector("#rangeFiveNumbers").innerHTML = "Calculating"; 
    var crimeCount = {
      onStatisticField: "Area_Name",  
      outStatisticFieldName: "areaCount",
      statisticType: "count"
    };
  
    var getAreaName = {
      onStatisticField: "Area_Name",  
      outStatisticFieldName: "name",
      statisticType: "max"
    };

    var areaNames = ["77th Street", "Central", "Southwest", "Pacific", "Southeast", "Newton", "Hollywood", "Olympic", "Wilshire", "Rampart", "Van Nuys", "Harbor", "Northeast", "Mission", "Topanga", "West Valley", "Hollenbeck", "Devonshire", "Foothill", "West LA", "N Hollywood"];
    var areaDict = {};
    var index = 0;
    var max = 0;
    var min = 0;

    for (areaName of areaNames) {
      var query = crimeData.createQuery();
      query.where = `AREA_NAME = '${areaName}' AND Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}'` + currentCrimeType;
      query.outStatistics = [crimeCount, getAreaName];

      var total = 0;
      crimeData.queryFeatures(query).then(function (response) {
        var stats = response.features[0].attributes;
        var name = stats.name;
        if (name == "West LA") { name = "West Los Angeles" };
        if (name == "N Hollywood") { name = "North Hollywood" };
        areaDict[name] = stats.areaCount;
        if (max == 0) {
          max = stats.areaCount;
          min = stats.areaCount;
        } else {
          if (stats.areaCount > max) { max = stats.areaCount; }
          if (stats.areaCount < min) { min = stats.areaCount; }
        }
        index++;
        total += stats.areaCount;
        if (index == 21) {
          console.log(total, "total")
          document.querySelector("#totalCount").innerHTML = `Total Crime Count: ${total}`;
          areaNames.splice(19, 2, 'West Los Angeles', 'North Hollywood');
          createGraphics(max, min, areaDict, areaNames);
        }
      });
    }
  }


  function createGraphics(max, min, areaDict, areaNames) {
    //If any area has no values
    for (area of areaNames) {
      if (!areaDict.hasOwnProperty(area)) {
        areaDict[area] = 0;
      }
    }
    var difference = max - min;
    var sectionSize = Math.round(difference / 5);
    var upperBoundArray = [];
    var currentBound = min;
    var colorDict = {}
    for (var i = 0; i < 5; i++) {
      currentBound += sectionSize;
      upperBoundArray.push(currentBound);

      if (i == 0) { document.querySelector("#rangeOneNumbers").innerHTML = `< ${currentBound}`; }
      else if (i == 1) { document.querySelector("#rangeTwoNumbers").innerHTML = `${currentBound} - ${currentBound - sectionSize}`; }
      else if (i == 2) { document.querySelector("#rangeThreeNumbers").innerHTML = `${currentBound} - ${currentBound - sectionSize}`; }
      else if (i == 3) { document.querySelector("#rangeFourNumbers").innerHTML = `${currentBound} - ${currentBound - sectionSize}`; }
      else { document.querySelector("#rangeFiveNumbers").innerHTML = `> ${currentBound - sectionSize}`; }
    }
    if (max < 5){
      document.querySelector("#rangeOneNumbers").innerHTML = `< 0`; 
      document.querySelector("#rangeTwoNumbers").innerHTML = `< 0`; 
      document.querySelector("#rangeThreeNumbers").innerHTML = `< 0`; 
      document.querySelector("#rangeFourNumbers").innerHTML = `< 0`; 
      document.querySelector("#rangeFiveNumbers").innerHTML = `>= 1`; 
      upperBoundArray = [1,1,1,1,1]
    }

    for (key in areaDict) {
      if (key === 'null') {
        continue;
      }
      //Getting color
      //const colors = [ "#3a4d6b", "#3d6da2", "#799a96", "#ccbe6a", "#ffec99" ];
      const colors = ["#4e4400", "#7a6a00", "#a79100", "#d3b700", "#ffdd00"];
      var color;
      var count = areaDict[key];
      if (count < upperBoundArray[0]) { color = colors[4] }
      else if (count < upperBoundArray[1]) { color = colors[3] }
      else if (count < upperBoundArray[2]) { color = colors[2] }
      else if (count < upperBoundArray[3]) { color = colors[1] }
      else { color = colors[0] }
      colorDict[key.toUpperCase()] = color;

      var geoQuery = {
        where: `APREC = '${key}'`,
        returnGeometry: true,
      }

      areaFill.queryFeatures(geoQuery).then(function (result) {
        var geo = result.features[0].geometry;
        var graphic = new Graphic({
          geometry: geo,
          symbol: {
            type: "simple-fill",
            color: colorDict[result.features[0].attributes.APREC]
          },
        });
        graphicsLayer.add(graphic);

      });
    }

  }


  /////CRIME TYPE INTERACTION/////
  //Display Crime Options - Function that creates interaction with showing crime type options/arrow movement
  var displayCrimeType = false;
  document.querySelector("#crimeHeaderWrapper").addEventListener("click", () => {
    var crimeForm = document.querySelector("#crimeOptions");
    if (displayCrimeType) {
      crimeForm.style.height = "0px";
      crimeForm.style.opacity = "0%";
      document.querySelector("#crimeArrow").style.transform = "rotateZ(180deg)";
      displayCrimeType = false;
    } else {
      crimeForm.style.height = "270px"; //260
      crimeForm.style.opacity = "100%";
      crimeForm.style.transform = "translateY(0)";
      displayCrimeType = true;
      document.querySelector("#crimeArrow").style.transform = "rotateZ(270deg)";
    }
  });


  //Attach click function to radio elements
  var crimeTypeSelection = document.getElementsByName("crimeType");
  for (let i = 0; i < crimeTypeSelection.length; i++) {
    crimeTypeSelection[i].addEventListener("click", crimeSelectionChange);
  }

  //Change of crime type
  function crimeSelectionChange(event) {
    document.querySelector("#crimeSelected").innerHTML = event.target.value;
    var crimeType = event.target.value;
    if (crimeType == "all"){currentCrimeType = '';}
    else{
      if(crimeType == "assault"){currentCrimeType = " AND Charge_Type = 'Assault'";}
      if(crimeType == "domestic"){currentCrimeType = " AND Charge_Type = 'Domestic'";}
      if(crimeType == "fraud"){currentCrimeType = " AND Charge_Type = 'Fraud/Money'";}
      if(crimeType == "homicide"){currentCrimeType = " AND Charge_Type = 'Homicide'";}
      if(crimeType == "kidnapping"){currentCrimeType = " AND Charge_Type = 'Kidnapping'";}
      if(crimeType == "miscellaneous"){currentCrimeType = " AND Charge_Type = 'Misc'";}
      if(crimeType == "property"){currentCrimeType = " AND Charge_Type = 'Property Related'";}
      if(crimeType == "sexual acts"){currentCrimeType = " AND Charge_Type = 'Sex Related'";}
      if(crimeType == "sexual assault"){currentCrimeType = " AND Charge_Type = 'Sexual Assault'";}
      if(crimeType == "theft"){currentCrimeType = " AND Charge_Type = 'Theft'";}
    }
    if(currentMapType == "heat"){
      heatMap.definitionExpression = `Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}' ${currentCrimeType}`;
    }
    else{
      createAreaMap();
    }
  }


  ////LEGEND INTERACTION//////
  //Display Legend - Function that creates interaction with showing legend/arrow movement
  var displayLegend = true;
  document.querySelector("#legendHeaderWrapper").addEventListener("click", () => {
    var legend = document.querySelector("#legendContent");
    if (displayLegend) {
      legend.style.height = "0px";
      legend.style.opacity = "0%";
      document.querySelector("#legendArrow").style.transform = "rotateZ(180deg)";
      displayLegend = false;
    } else {
      legend.style.height = "180px";
      legend.style.opacity = "100%";
      legend.style.transform = "translateY(0)";
      displayLegend = true;
      document.querySelector("#legendArrow").style.transform = "rotateZ(270deg)";
    }
  });

  ////MAP TYPE INTERACTION//////////
  var displayMapType = false;
  document.querySelector("#mapTypeHeaderWrapper").addEventListener("click", () => {
    var mapOptions = document.querySelector("#mapOptions");
    if (displayMapType) {
      mapOptions.style.height = "0px";
      mapOptions.style.opacity = "0%";
      document.querySelector("#mapTypeArrow").style.transform = "rotateZ(180deg)";
      displayMapType = false;
    } else {
      mapOptions.style.height = "70px"; //260
      mapOptions.style.opacity = "100%";
      mapOptions.style.transform = "translateY(0)";
      displayMapType = true;
      document.querySelector("#mapTypeArrow").style.transform = "rotateZ(270deg)";
    }
  });

  //Attach click function to radio elements
  var mapTypeSelection = document.getElementsByName("mapType");
  for (let i = 0; i < mapTypeSelection.length; i++) {
    mapTypeSelection[i].addEventListener("click", mapSelectionChange);
  }

  //Change of map type
  var currentMapType = 'area';
  function mapSelectionChange(event) {
    var mapType = event.target.value;
    document.querySelector("#mapTypeSelected").innerHTML = mapType;
    map.removeAll();
    if (mapType == "Heat Map") {
      heatMap.definitionExpression = `Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}' ${currentCrimeType}`;
      map.add(heatMap);
      currentMapType = "heat";

      document.querySelector("#totalCount").innerHTML = "Heat Map Range:"
      document.querySelector("#rangeOneNumbers").innerHTML = `Sparse`; 
      document.querySelector("#rangeTwoNumbers").innerHTML = ``; 
      document.querySelector("#rangeThreeNumbers").innerHTML = ``; 
      document.querySelector("#rangeFourNumbers").innerHTML = ``; 
      document.querySelector("#rangeFiveNumbers").innerHTML = `Dense`; 


    } else if (mapType == "Area Map") {
      createAreaMap();
      map.add(areaOutlines);
      map.add(areaFill);
      map.add(graphicsLayer);
      currentMapType = "area";
    }
  }

  ////DATE RANGE INTERACTION//////////
  var displayDateRange = false;
  document.querySelector("#dateHeaderWrapper").addEventListener("click", () => {
    var dateRange = document.querySelector("#dateContent");
    if (displayDateRange) {
      dateRange.style.height = "0px";
      dateRange.style.opacity = "0%";
      document.querySelector("#dateArrow").style.transform = "rotateZ(180deg)";
      displayDateRange = false;
    } else {
      dateRange.style.height = "150px"; //260
      dateRange.style.opacity = "100%";
      dateRange.style.transform = "translateY(0)";
      displayDateRange = true;
      document.querySelector("#dateArrow").style.transform = "rotateZ(270deg)";
    }
  });

  //Attach click function to select elements
  var dateSelection = document.getElementsByTagName("select");
  for (let i = 0; i < dateSelection.length; i++) {
    dateSelection[i].addEventListener("click", dateSelectionChange);
  }

  var startDate = "January 2020";
  var endDate = "September 2020";
  var monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var yearArray = ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020"];
  var startMonthDict = {
    "January": "01/01/", 
    "February": "02/01/", 
    "March": "03/01/", 
    "April": "04/01/", 
    "May": "05/01/", 
    "June": "06/01/", 
    "July": "07/01/", 
    "August": "08/01/",
    "September": "09/01/", 
    "October": "10/01/", 
    "November": "11/01/", 
    "December": "12/01/"
  }
  var endMonthDict =  {
    "January": "01/31/", 
    "February": "02/28/", 
    "March": "03/31/", 
    "April": "04/30/", 
    "May": "05/31/", 
    "June": "06/30/", 
    "July": "07/31/", 
    "August": "08/31/",
    "September": "09/30/", 
    "October": "10/31/", 
    "November": "11/30/", 
    "December": "12/31/"
  }
  function dateSelectionChange(event) {
    var selectArray = document.getElementsByTagName("select");
    var newStartDate = "";
    var newEndDate = "";

    for (var i = 0; i < selectArray.length; i++) {
      var selectionValue = selectArray[i].options[selectArray[i].selectedIndex].text;
      if (i == 0) { newStartDate += selectionValue + " "; } //start month
      else if (i == 1) { newStartDate += selectionValue; }
      else if (i == 2) { newEndDate += selectionValue + " "; } //end month
      else { newEndDate += selectionValue; }
    }
    //Detect if the date has changed
    if (startDate != newStartDate || endDate != newEndDate) {
      startDate = newStartDate;
      endDate = newEndDate;
      var changedClass = event.target.className;
      var startYear = startDate.split(" ")[1];
      var startMonth = startDate.split(" ")[0];
      var endYear = endDate.split(" ")[1];
      var endMonth = endDate.split(" ")[0];


      //Changing Possible Selections based on what new selection is
      //Wipe clean selection options and add new options from arrays above
      //If years are different, we can safely add all months back to selection
      if (startYear != endYear) {
        //Adding all months for start
        selectArray[0].options.length = 0;
        for (month of monthArray) {
          var option = document.createElement("option")
          option.text = month;
          if (month == startMonth) { option.setAttribute('selected', 'selected'); }
          selectArray[0].add(option);
        }
        //Adding all months for End
        selectArray[2].options.length = 0;
        for (month of monthArray) {
          var option = document.createElement("option")
          option.text = month;
          if (month == endMonth) { option.setAttribute('selected', 'selected'); }
          selectArray[2].add(option);
        }

      }

      //If start date changed, need to add options for end date
      //Iterate through arrays until we hit the year/month for start date
      if (changedClass == "startDate") {
        //Adding years to end selection
        selectArray[3].options.length = 0; //set end year selection to empty
        for (var i = 10; i > -1; i--) {
          var option = document.createElement("option")
          option.text = yearArray[i];
          //Check if this is selected option and set it to selected
          if (yearArray[i] == endYear) { option.setAttribute('selected', 'selected'); }
          selectArray[3].add(option, 0);
          if (yearArray[i] == startYear) { break; }
        }

        //Adding Months to end selection if years are the same
        if (startYear == endYear) {
          //Iterate through array, if we hit the start month but haven't hit the end month that was selected
          //Means end month was before start month after change. Set the new end month to the start month
          var selectedAdded = false;
          selectArray[2].options.length = 0;
          for (var i = 11; i > 0; i--) {
            var option = document.createElement("option")
            option.text = monthArray[i];
            if (monthArray[i] == endMonth) { option.setAttribute('selected', 'selected'); selectedAdded = true; }
            if (monthArray[i] == startMonth) {
              if (selectedAdded) { selectArray[2].add(option, 0); }
              else {
                endMonth = startMonth;
                option.setAttribute('selected', 'selected');
                selectArray[2].add(option, 0);
              }
              break;
            } else { selectArray[2].add(option, 0); }
          }

          selectArray[0].options.length = 0;
          for (var i = 0; i < 12; i++) {
            var option = document.createElement("option")
            option.text = monthArray[i];
            if (monthArray[i] == startMonth) { option.setAttribute('selected', 'selected'); }
            selectArray[0].add(option);
            if (monthArray[i] == endMonth) { break; }
          }
        }
      } else {
        //If the end date has changed
        selectArray[1].options.length = 0; //set start year selection to empty
        for (var i = 0; i < 11; i++) {
          var option = document.createElement("option")
          option.text = yearArray[i];
          if (yearArray[i] == startYear) { option.setAttribute('selected', 'selected'); }
          selectArray[1].add(option);
          if (yearArray[i] == endYear) { break; }
        }
        //adding months to start selection
        if (startYear == endYear) {
          var selectedAdded = false;
          selectArray[0].options.length = 0;
          for (var i = 0; i < 12; i++) {
            var option = document.createElement("option")
            option.text = monthArray[i];
            if (monthArray[i] == startMonth) { option.setAttribute('selected', 'selected'); selectedAdded = true; }
            if (monthArray[i] == endMonth) {
              if (selectedAdded) { selectArray[0].add(option); }
              else {
                startMonth = endMonth;
                option.setAttribute('selected', 'selected');
                selectArray[0].add(option);
              }
              break;
            } else { selectArray[0].add(option); }
          }

          selectArray[2].options.length = 0;
          for (var i = 11; i > -1; i--) {
            var option = document.createElement("option")
            option.text = monthArray[i];
            if (monthArray[i] == endMonth) { option.setAttribute('selected', 'selected'); }
            selectArray[2].add(option, 0);
            if (monthArray[i] == startMonth) { break; }
          }
        }
      }
      
      currentStartDate = startMonthDict[startMonth] + startYear;
      currentEndDate = endMonthDict[endMonth] + endYear;

      if(currentMapType == "heat"){
        heatMap.definitionExpression = `Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}' ${currentCrimeType}`;
      }
      else{
        createAreaMap();
      }


      /*
      console.log(startYear);
      console.log(startMonth);
      console.log(endYear);
      console.log(endMonth);*/
    }
  }


});



