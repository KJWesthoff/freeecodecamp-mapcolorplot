//fetch data
console.log("Index js running")

const EdDataUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
const CountyDataUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
const colormap = ["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#4a1486"]



// main map chart
const w = 1200
const h = 800
pd = 30


// Something d3 apparantly not needing a projection.
const path = d3.geoPath()

fetchData = async () => {

  let response = await fetch(EdDataUrl)
  const eddata = await response.json()

  response = await fetch(CountyDataUrl)
  const usTopo = await response.json()

  console.log(eddata)
  //console.log(usTopo)
  
  
  // get the bounds for the education data
  minEd = eddata.reduce((next,curr) => curr.bachelorsOrHigher < next.bachelorsOrHigher ? curr : next).bachelorsOrHigher
  maxEd = eddata.reduce((next,curr) => curr.bachelorsOrHigher > next.bachelorsOrHigher ? curr : next).bachelorsOrHigher


  // headings
  const chartelem = d3.select('.map-container')
    .append('div');
  
  const heading = chartelem.append('heading');
      heading
        .append('h2')
        .attr('id', 'title')
        .text('University education level by county')
    
      heading
        .append('h3')
        .attr('id', "description")
        .html(
          `Percentage of adults aged 25 and older with a bachelor's degree or higher`  
        )
    

  // define chart

  const svg = d3.select(".map-container")
  .append("svg")
  .attr("width", w)
  .attr("height", h)

  // legend size
  const lw = w/6
  const lh = 20


  // generate array based on the data range and the number of colors
  const thDomainFunc = (min,max,count) => {
    const arr = [];
    const step = (max-min)/count;
    for(var i = 1; i<count; i++){
      arr.push(min+i*step)
    } return arr;
  }

  const lArrData = thDomainFunc(minEd,maxEd, colormap.length)


  //legend thresholds, function to map ranges to colors
  const thresholds = d3.scaleThreshold()
     .domain(lArrData)
     .range(colormap)

  // legend axes
  const lXScale = d3.scaleBand()
    .domain(lArrData)
    .range([0,lw])

  const lXAxis = d3.axisBottom()
    .scale(lXScale)
    .tickValues(thresholds.domain())
    .tickFormat(d3.format('.1f'));

  const legend = svg //append legend to the chart element
    .append('g')
    .classed("legend",true)
    .attr("id", "legend")
    .attr("transform", "translate(" + pd + "," + (h-pd*3) + ")")


  legend
    .append('g')
    .selectAll('rect')
    .data(lArrData)
    .enter()
    .append('rect')
    .style('fill', d => thresholds(d))
    .attr('x', d => lXScale(d))
    .attr('y', 0)
    .attr('height', lh)
    .attr('width', lXScale.bandwidth)


  legend
    .append('g')
    .call(lXAxis)


  // tooltip holder:
  var tooltip = d3.selectAll("body")
     .append("div")
     .attr("id", "tooltip")


  // digout data with topojson for painting the map
  const counties = topojson.feature(usTopo, usTopo.objects.counties).features
  const states = topojson.feature(usTopo, usTopo.objects.states).features


  // draw all the counties
  const countyMap = svg.selectAll("county")
    .append('g')
    .data(counties)
    .enter()
    .append('path')
    .attr("class", "county")
    .attr("data-fips", d => d.id)
    .style("fill", d => {   
      return thresholds(eddata.find(ed => ed.fips === d.id).bachelorsOrHigher)
    })
    .attr("data-education", d => eddata.find(ed => ed.fips === d.id).bachelorsOrHigher)
    .attr("d", path)
    .on('mouseover', (e, d) => {
      // set the css for the county
      d3.select(e.target).classed("selected", true)
      // digout the data about the county
      let data = eddata.find(ed => ed.fips === d.id)
      // populate the tooltip and show
      return tooltip
              .style("visibility", "visible")
              .style("top", (e.pageY-10)+"px")
              .style("left",(e.pageX+10)+"px")
              .attr("data-education", data.bachelorsOrHigher)
              .html(`
                <span> Area fips code ${data.fips}</span>
                </br>
                <span> ${data.area_name}, ${data.state}  </span>
                </br>
                <span> Graduate % ${data.bachelorsOrHigher}</span>
              `)
    })
    // reset all of the above
    .on('mouseout', (e, d) => {
      d3.select(e.target).classed("selected", false)
      return tooltip.style("visibility", "hidden")
      
    
    
    })

  // draw the states
  const stateMap = svg.selectAll("states")
    .append('g')
    .data(states)
    .enter()
    .append('path')
    .attr("class", "state")
    .attr("d", path)
}
fetchData()



