/**
 * @file d3.js Customizeable Bubble Chart
 * @author Sam Stiffman <samstiffman@gmail.com>
 * @version 1.1
 * @requires http://d3js.org/d3.v5.min.js
 */



/**
  * Function that constructs an easy to use d3.js bubble chart with mouseOver tooltips
  * Since the first 3 parameters are required they have to be in the correct order, the other Parameters
  * However can be passed with names but have to be passed as parts of an object and they have to be named
  * example of named parameters: {nameField: "country", xScaleType: "x"}
  * @param {String} CSVpath - The path to the CSV file
  * @param {String} xField - The CSV field used for X Axis values
  * @param {String} yField - The CSV field used for Y Axis Values
  * Optional Parameters
  * @param {int[]} xRange - the Range of X Values @default '[minXVal, maxXval]'
  * @param {int[]} yRange - the Range of Y Values @default '[minYVal, maxYval]'
  * @param {String} nameField - The CSV field used for bubble labels @default ""
  * @param {String} colorField - The CSV field used for choosing colors @default yField
  * @param {String} sizeField - The CSV field used for choosing bubble size @default yField
  * @param {color[]} colorScale - The scale used to specify bubble colors can be hex or literal CSS colors @default ["red", "blue"]
  * @param {int[]} sizeScale - The scale used to specify range of bubble sizes in pixels @default [5,30]
  * @param {boolean} showLabels - Show the names of each bubble as a floating tag @default false
  *
  * Discreet colors
  * @param {boolean} discreetColorScale - If true colorScale will be computed discreetly as a mapping from colorMapping -> colorScale @default false
  * @param {Number[]} colorMapping - Values that map to the corresponding discreet color scale @default null
  *
  * Discreet color mapping uses the colorMapping and colorScale parameters and maps each value of colorMapping to the corresponding value from color Scale
  * These values are retrieved from the @see colorField
  * example pseudocode: colorMapping: [1,2,3,4] colorScale: ["red","green","purple","blue"] maps 1->red, 2->green, 3->purple, 4->blue
  * The values used for this mapping are from @see colorField parameter
  *
  *
  * These scales are so that your data will fit on the graph, most data will be the default linear scale
  * You can specify: (Linear, Log, Sqrt, or Power) these correspond to the built in d3 functions
  * (scaleLinear, scaleLog, scaleSqrt, and scalePow)
  * @param {xScaleType} @default "linear"
  * @param {yScaleType} @default "linear"
  * @param {colorScale} @default "linear"
  * @param {sizeScale} @default  "linear"
  *
  *
  * @example
  * bubbleChart('MyData.csv', "X_Value", "Y_Value", {nameField: "Country_Name", xScaleType: "power", yScaleType: "sqrt"});
  * @example This is the simplest possible example
  * bubbleChart('MyData.csv', "x", "y")
  */
function bubbleChart(CSVpath, xField, yField, {xRange, yRange, nameField=null,
  colorField=yField, sizeField=yField,
  colorScale=["red","blue"], sizeScale=[5,30], showLabels=false, discreetColorScale=false,
  colorMapping, xScaleType="linear", yScaleType="linear", colorScaleType="linear", sizeScaleType="linear"}={}){

  //Throws exceptions if missing required parameters
  if(!CSVpath){
    throw "CSVpath variable not set";
  }else if(!xField){
    throw "xField variable not set";
  }else if(!yField){
    throw "yField variable not set"
  }

  d3.csv(CSVpath).then(function(data) {
    /* Read CSV file */
    let arrayOfValues = new Array();
    for (let i=0; i < data.length; i++) {
      //Set NaN data to null so it can be eliminated later
      if(isNaN(data[i][xField]) ||
       isNaN(data[i][yField]) ||
       isNaN(data[i][sizeField])){
         console.log("check your fields: " + data[i] + " array at index " + i + " set to null")
        arrayOfValues[i] = null;
        continue;
      }
      //Ternary statement to set label value to "" if the field is undefined/false/null
      arrayOfValues[i] = { label:(data[i][nameField]?data[i][nameField]:""),
       x: Number(data[i][xField]), y: Number(data[i][yField])
       , color: data[i][colorField], size: Number(data[i][sizeField])};
    }

    let maxValX = Math.max(...arrayOfValues.map(val => val.x));
    let maxValY = Math.max(...arrayOfValues.map(val => val.x));
    let minValX = Math.min(...arrayOfValues.map(val => val.y));
    let minValY = Math.min(...arrayOfValues.map(val => val.y));

    let maxValSize = Math.max(...arrayOfValues.map(val => val.size));
    let minValSize = Math.min(...arrayOfValues.map(val => val.size));
    let maxValColor = Math.max(...arrayOfValues.map(val => Number(val.color)));
    let minValColor = Math.min(...arrayOfValues.map(val => Number(val.color)));

    //Remove all the nulls from the array
    arrayOfValues = removeNulls(arrayOfValues);
    let tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("opacity", "0")
      .style("color", "blue")
      .style("padding", "8px")
      .style("border-radius", "6px")
      .style("background-color", "#f0f0f0")
      .style("text-align", "center")
      .style("font-family", "monospace")
      .style("width", "175px")
      .text("");

    // These are the dimensions of the bubble map
    // The scales tell the data how to scale each field
    let w = window.screen.width * 0.5,
        h = window.screen.height * 0.8,
        p = 60,
        color,
        size = chooseScale(sizeScaleType).domain([minValSize,maxValSize]).range(sizeScale),
        xScale = chooseScale(xScaleType),
        yScale = chooseScale(yScaleType);
    if(Array.isArray(xRange)){
      xScale = xScale.domain(xRange).range([0, w]);
    }else{
      xScale = xScale.domain([ minValX, maxValX ]).range([0, w]);
    }
    if(Array.isArray(yRange)){
      yScale = yScale.domain(yRange).range([h, 0]);
    }else{
      yScale = yScale.domain([ minValY, maxValY ]).range([h, 0]);
    }

    //Discreet color mapping, colorMapping must not be null, and can only be undefined if the values of the color column are colors
    if(discreetColorScale){
      if(colorMapping){
        color = d3.scaleOrdinal().domain(colorMapping).range(colorScale);
      }else{
        color = d3.scaleOrdinal().domain(arrayOfValues.map(val => val.color)).range(arrayOfValues.map(val => val.color))

      }
    }else{
      if(Number(maxValColor)){
        color = chooseScale(colorScaleType).domain([maxValColor, minValColor]).range(colorScale);
      }else{
        color = chooseScale(colorScaleType).domain(arrayOfValues.map(val => colorHexToNumber(val.color))).range(colorScale);
      }
    }

    let graph = d3.select("body")
      .data(arrayOfValues)
    .append("svg:svg")
      .attr("width", w + p * 2)
      .attr("height", h + p * 2)
    .append("svg:g")
      .attr("transform", "translate(" + p + "," + p + ")");


    let rules = graph.selectAll("g.rule")
      .data(xScale.ticks(10))
    .enter().append("svg:g")
      .attr("class", "rule");

    // Draw grid lines
    rules.append("line")
      .style("stroke", "black")
      .attr("x1", xScale)
      .attr("x2", xScale)
      .attr("y1", 0)
      .attr("y2", h);

    rules.append("line")
      .data(yScale.ticks(10))
      .style("stroke", "black")
      .attr("y1", yScale)
      .attr("y2", yScale)
      .attr("x1", 0)
      .attr("x2", w);

   // Place axis tick labels
   rules.append("text")
    .attr("x", xScale)
    .attr("y", h + 15)
    .attr("dy", ".71em")
    .attr("text-anchor", "middle")
    .text(xScale.tickFormat(10))

   rules.append("text")
    .data(yScale.ticks(10))
    .attr("y", yScale)
    .attr("x", -10)
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .text(yScale.tickFormat(10));


    // Add Svg container, svg:g to bubbles
    let bubbles = graph.selectAll("circle.line")
      .data(arrayOfValues)
      .enter().append("g")
      .attr("class", "node")

    /* Add bubbles to graph
    * cx is the bubble x value
    * cy is the bubble y value
    * r is the bubble radius
    * fill is the color of the bubble
    */
    bubbles.append("circle")
      .attr("class", "line")
      .attr("fill", function(d) { return color(d.color);})
      .attr("cx", function(d) { return xScale(d.x);})
      .attr("cy", function(d) { return yScale(d.y);})
      .attr("r", function(d) { return size(d.size);
      })
      .on("mouseover", function(d){ //Show tooltip when mouse enters
       tooltip.html(d.label +"<br>"+ xField + ": " +d.x+"<br>" + yField + ": "+ d.y);
        //Values displayed on the Tooltip
       return tooltip.style("opacity", 100);})
      .on("mousemove", function(){ // Follow mouse cursor movement
       return tooltip.style("top", (d3.event.pageY-10)+"px")
       .style("left",(d3.event.pageX+10)+"px");})
      .on("mouseout", function(){return tooltip.style("opacity", "0");});


  //Circle labels
  if(showLabels){


    bubbles.append("text")
      .attr("text-anchor", "middle")
      .text(function(d){return d.label;})
      .attr("x", function(d) { return xScale(d.x);})
      .attr("y", function(d) { return yScale(d.y);})
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("fill", "black")
      .attr("dy", ".5em");


    }
});//d3.csv End
}//Function End
// Function to remove nulls from an array
function removeNulls(array){
  for(let i=0; i<array.length; i++){
    if(!array[i]){
      array.splice(i,1);
      i--;
    }
  }
  return array;
};

// Function for making scaling parameters work without too many conditional statements
function chooseScale(scalingParameter){
  switch(scalingParameter.toLowerCase()){
    case "logarithm":
    case "log":
    case "l":
      return d3.scaleLog();
    case "pow":
    case "power":
    case "p":
      return d3.scalePow();
    case "sqrt":
    case "s":
      return d3.scaleSqrt();
    default:
      return d3.scaleLinear();
  }
}

function colorHexToNumber(color){
  let tempC = color.replace(/#/g, '');
  tempC = parseInt(tempC, 16);
  if(isNaN(tempC)){
    throw "Color column could not be made into a number";
  }
  else{
    return tempC
  }
}
