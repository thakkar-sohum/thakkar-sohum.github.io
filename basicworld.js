class BasicPerson {
    constructor({
        index,
        pos, 
        angle, 
        speed, 
        radius, 
        covidState, 
        susceptibility, 
        infectivity, 
        asymptomatic_probability,
        age,
        world_ref
    }) {
        this.index = index;
        this.pos = pos;
        this.angle = angle;
        this.speed = speed;
        this.radius = radius;
        this.covidState = covidState;
        this.susceptibility = susceptibility;
        this.infectivity = infectivity;
        this.asymptomatic_probability = asymptomatic_probability;
        this.timeStateStart = world_ref.currentTime;
        this.age = age;
        this.world_ref = world_ref;
        this.contact_history = [];
    }

    changeState(new_state) {
        this.world_ref.compartmentStats[this.covidState] -= 1;
        this.world_ref.compartmentStats[new_state] += 1;
        this.covidState = new_state;
        this.timeStateStart = this.world_ref.currentTime;
    }

    interact(otherPerson) {
        // people can infect if asymptomatic or infected
        if ((otherPerson.covidState == "infected" || otherPerson.covidState == "asymptomatic" ) && this.covidState == "susceptible"){
            if (this.sample_transmission(otherPerson.infectivity)) {
                this.changeState("latent");
            }
        }
        this.contact_history.push(otherPerson.index);
        if (this.covidState == "tracer") {
            for (var i = 0; i < otherPerson.contact_history.length; i++) {
                // Go through the other contact history and set their state to "traced"
                this.world_ref.people[otherPerson.contact_history[i]].changeState("traced");
            }
        }
    }

    step() {
        // logic for state transitions
        var stateTimeDays = (this.world_ref.currentTime-this.timeStateStart)/this.world_ref.ticksPerDay; //stateTime in days
        if (this.covidState == "latent") {
            if (this.sample_infection_onset(stateTimeDays)) {
                if (this.sample_asymptomatic()) {
                    this.changeState("asymptomatic");
                } else {
                    this.changeState("infected");
                }
            }
        } else if (this.covidState == "infected" || this.covidState == "asymptomatic") {
            if (this.sample_recovery(stateTimeDays)) {
                this.changeState("recovered");
            } else if (this.sample_death(stateTimeDays) && this.covidState != "asymptomatic") {
                this.changeState("dead");
            }
        }
        
        //logic for if a ball should move, currently just if they arent dead
        if (this.covidState != "dead"){
            this.pos = geometric.pointTranslate(this.pos, this.angle, this.speed/this.world_ref.ticksPerDay);
        }
    }

    sample_transmission(infectivity) {
        // logic for infection - infection spreads w.p. (susceptible person's) susceptibility * (infected person's )infectivity
        return Math.random() < infectivity * this.susceptibility;
    }

    sample_infection_onset(timeLatent) {
        // latent phase from 2 -14 days
        const minTimeLatent = 2
        const maxTimeLatent = 14
        if (timeLatent < minTimeLatent) {
            return 0
        } else {
            var rampingPeriod = maxTimeLatent - minTimeLatent
            const probabilityPerDay = (timeLatent - minTimeLatent) / rampingPeriod
            return Math.random() < probabilityPerDay;
        }
    }

    sample_recovery(timeInfected) {
        // guaranteed infection for 2 weeks
        const minInfectionDays = 14
        const maxInfectionDays = 24
        if (timeInfected < minInfectionDays) {
            return 0
        } else {
            var rampingPeriod = maxInfectionDays - minInfectionDays
            const probabilityPerDay = (timeInfected - minInfectionDays) / rampingPeriod
            const probabilityPerTick = probabilityPerDay / this.world_ref.ticksPerDay
            return Math.random() < probabilityPerTick;
        }
    }

    sample_death(timeInfected) {
        // these are both heuristics. decreasing minInfectionTime will rapidly increase death rate
        const minInfectionDays = 17
        const maxInfectionDays = 27
        var rampingPeriod = maxInfectionDays - minInfectionDays
        const probabilityPerDay = (timeInfected - minInfectionDays) / rampingPeriod
        const probabilityPerTick = probabilityPerDay / this.world_ref.ticksPerDay
        return Math.random() < probabilityPerTick;
    }

    sample_asymptomatic() {
        return Math.random() < this.asymptomatic_probability;
    }
}


class BasicWorldSimulation extends ParticleSimulation {
    static states = ["latent", "asymptomatic", "infected", "susceptible", "recovered", "dead"];

    constructor(dimensions, duration = 1000, ticksPerDay = 10, numPersons = 200){
        super(dimensions, duration, ticksPerDay, numPersons);
        this.initialize()

        return this;
    }

    addPersons() {
        for (let i = 0; i < this.numPersons; i++){ this.addPerson(); }
    }

    addPerson(){
        var person = new BasicPerson({
            index: this.people.length,
            radius: Math.sqrt(this.width * this.height / 10000),
            pos: [
              d3.randomUniform(0, this.width)(),
              d3.randomUniform(0, this.height)(),
            ],
            angle: d3.randomUniform(0, 360)(),
            speed: d3.randomUniform(5, 10)(),
            covidState: this.sample_covidState(),
            susceptibility: this.sample_susceptibility(),
            infectivity: this.sample_infectivity(),
            asymptomatic_probability: 0.5,
            age: 20,
            world_ref: this,
        });
        this.people.push(person);
        this.compartmentStats[person.covidState] += 1
    }

    sample_covidState(person) {
        return d3.randomUniform(1)() < .05 ? "infected" : "susceptible";
    }

    sample_susceptibility(person) {
        return randn_bm(1, .1);
    }

    sample_infectivity(person) {
        return randn_bm(1, .1);
    }
}