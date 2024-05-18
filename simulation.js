// The Simulation class
class ParticleSimulation {
    static states = []
    constructor(dimensions, duration, ticksPerDay, numPersons) {
        this.width = dimensions.width;
        this.height = dimensions.height;
        this.center = [this.width/2, this.height/2];
        this.duration = duration;
        this.playing = 0;
        this.numPersons = numPersons;
        this.currentTime = 0;
        this.ticksPerDay = ticksPerDay;

        return this;
    }

    advancePerson(person) {
        person.step();
    }

    interact(person, otherPerson) {
        person.interact(otherPerson);
        otherPerson.interact(person);
        bounce(person, otherPerson);
    }

    advanceWorld() {
        this.currentTime += 1;
    }
    
    initialize() {
        this.currentTime = 0;
        // data structure to hold info on how many particles in each compartment. for plotting purposes
        // loop through this.states and initialize each as an element of the compartmentStats dictionary with value 0
        this.compartmentStats = {}
        for (let i = 0; i < this.constructor.states.length; i++) {
            this.compartmentStats[this.constructor.states[i]] = 0;
        }
        
        this.people = [];
        this.addPersons();
    }

    tick(){
        const quadtree = d3.quadtree()
            .x(d => d.pos[0])
            .y(d => d.pos[1])
            .extent([0, 0], [1, 1])
            .addAll(this.people);

        for (let i = 0, l = this.people.length, maxRadius = 0; i < l; i++) {
            const person = this.people[i];

            if (person.radius > maxRadius) maxRadius = person.radius;

            const r = person.radius + maxRadius,
                        nx1 = person.pos[0] - r,
                        nx2 = person.pos[0] + r,
                        ny1 = person.pos[1] - r,
                        ny2 = person.pos[1] + r;

            // Visit each square in the quadtree
            // x1 y1 x2 y2 constitutes the coordinates of the square
            // We want to check if each square is a leaf person (has data prop)
            quadtree.visit((visited, x1, y1, x2, y2) => {
                //can't bounce if dead
                if (visited.data && visited.data.index !== person.index && person.covidState != "dead" && visited.data.covidState != "dead") {

                    // Collision!
                    var xdist = (person.pos[0] - visited.data.pos[0]);
                    var ydist = (person.pos[1] - visited.data.pos[1]);

                    const realLineLength = Math.sqrt(xdist*xdist + ydist*ydist)
                    if (
                        (realLineLength < person.radius + visited.data.radius)
                        && moving_closer(person, visited.data)
                    ) {
                        this.interact(person, visited.data);
                    }
                }

                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });

            // Detect sides
            const wallVertical = person.pos[0] <= person.radius || person.pos[0] >= this.width - person.radius,
                  wallHorizontal = person.pos[1] <= person.radius  || person.pos[1] >= this.height - person.radius;

            if (wallVertical || wallHorizontal){
                

                // Is it moving more towards the middle or away from it?
                const t0 = geometric.pointTranslate(person.pos, person.angle, person.speed);
                const l0 = geometric.lineLength([this.center, t0]);

                const reflected = geometric.angleReflect(person.angle, wallVertical ? 90 : 0);
                const t1 = geometric.pointTranslate(person.pos, reflected, person.speed);
                const l1 = geometric.lineLength([this.center, t1]);

                if (l1 < l0) person.angle = reflected;

            }

            this.advancePerson(person);
        }
        this.advanceWorld();
    }

}