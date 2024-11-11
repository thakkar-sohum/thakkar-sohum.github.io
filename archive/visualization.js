// create map from state string to color string
var stateColorMap = {
"latent": "peachpuff", 
"asymptomatic": "lightsalmon",
"infected": "coral", 
"susceptible": "lightsteelblue",
"recovered":"mediumpurple",
"dead": "black",
"tracer": "green",
"traced": "lightgreen",
}
class SimulationVisualization {
    constructor(id) {
        this.wrapper = document.getElementById(id);
        const rect = this.wrapper.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.wrapper.appendChild(this.canvas);

        this.ctx = this.canvas.getContext("2d");

        this.scalingFactor = 1; // Can adjust as needed
        this.borderWidth = 0; // Can adjust as needed

        return this;
    }

    update(data) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        data.forEach(person => this.drawCircle(person));

        this.ctx.lineWidth = this.borderWidth;
        this.ctx.strokeStyle = "#000000";
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCircle(person) {
        const drawPos = [
            person.pos[0] * this.scalingFactor + this.borderWidth,
            person.pos[1] * this.scalingFactor + this.borderWidth
        ];
        const drawRad = person.radius * this.scalingFactor;

        this.ctx.beginPath();
        this.ctx.arc(...drawPos, drawRad, 0, 2 * Math.PI);

        this.ctx.fillStyle = stateColorMap[person.covidState];
        this.ctx.fill();
    }
}

class SimulationGraph {
    constructor(id, numTicks, numParticles) {
        const wrapper = document.getElementById(id);
        const rect = wrapper.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Store a reference to the SVG element
        this.svg = d3.select(wrapper)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g");

        // Add axes
        this.x = d3.scaleLinear()
            .domain([0, numTicks])
            .range([0, width]);
        this.y = d3.scaleLinear()
            .domain([0, numParticles])
            .range([height, 0]);
        this.svg.append("g")
            .call(d3.axisLeft(this.y));

        // Add the areas for each compartment
        for (const stateLabel in stateColorMap) {
            this.svg.append("path")
                .attr("fill", stateColorMap[stateLabel])
                .attr("id", stateLabel);
        }

        this.logNum = 0;
        this.counts = {};
        this.times = [];
        this.logCounts = [];
        this.numParticles = numParticles;
    }

    update(stats, time) {
        console.log(this);
        for (const [key, value] of Object.entries(stats)) {
            if (!this.counts[key]) {
                this.counts[key] = [];
            }
            this.counts[key].push(value);
        }
        this.times.push(time);
        this.logCounts.push(this.logNum);
        this.logNum += 1;
        this.plot();
    }

    plot() {
        const states = Object.keys(this.counts);

        states.forEach((state, i) => {
            const areaGenerator = d3.area()
                .x((d) => this.x(this.times[d]))
                .y0((d) => {
                    let sum = 0;
                    for (let j = 0; j < i; j++) {
                        sum += this.counts[states[j]][d];
                    }
                    return this.y(sum);
                })
                .y1((d) => {
                    let sum = 0;
                    for (let j = 0; j <= i; j++) {
                        sum += this.counts[states[j]][d];
                    }
                    return this.y(sum);
                });

            this.svg.select(`#${state}`)
                .datum(this.logCounts)
                .attr("d", areaGenerator);
        });

    }

    clear() {
        this.logNum = 0;
        this.counts = {};
        this.times = [];
        this.logCounts = [];
        this.plot();
    }
}


class SimulationTable {
    constructor(id, initStats) {
        const wrapper = document.getElementById(id);
        var rect = wrapper.getBoundingClientRect(),
            width = rect.width,
            height = rect.height;

        const yOffset = 30
        const xOffset = 30
        // append table count svg object to wrapper
        this.tableCount = d3.select(wrapper)
            .append("svg")
                .attr("width", width)
                .attr("height", height)
                .style("float", "left");

        // create circles for each label in table
        this.tableCount.selectAll("mydots")
            .data(Object.keys(initStats))
            .enter()
            .append("circle")
            .attr("cx", xOffset)
            .attr("cy", function(d,i){ return yOffset - 1 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 7)
            .style("fill", function(d){ return stateColorMap[d]});

        // create labels for table
        this.tableCount.selectAll("mylabels")
            .data(Object.keys(initStats))
            .enter()
            .append("text")
            .attr("x", xOffset + 20)
            .attr("y", function(d,i){ return yOffset + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("font-family", "sans-serif")
            .style("fill", function(d){ return stateColorMap[d]})
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")


        // create initial counts for table (Probably should of done this and labels at the same time)
        this.tableCount.selectAll("mycounts")
            .data(Object.keys(initStats))
            .enter()
            .append("text")
                .attr("id", "tableCountID")
            .attr("x", xOffset + 130)
            .attr("y", function(d,i){ return yOffset + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("font-family", "sans-serif")
            .style("fill", function(d){ return stateColorMap[d]})
            .text(function(d){ return initStats[d]})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");
    }

    update(stats) {
      // update table counts
      this.tableCount.selectAll("#tableCountID")
          .data(Object.values(stats))
          .text(function(d){ return d});
    }
}


function getStats() {
    const stats = new Stats();
    stats.domElement.style.position = "absolute";
    stats.domElement.style.left = "0px";
    stats.domElement.style.top = "0px";
    document.getElementById("stats").appendChild(stats.domElement);
    return stats;
}
