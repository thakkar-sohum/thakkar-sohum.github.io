// Standard Normal variate using Box-Muller transform.
function randn_bm(mean, std) {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    var pre_transform = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return pre_transform * std + mean
}

//functions return probability per day, rest done in sim
function recovery_function(timeInfected) {
    // guaranteed infection for 2 weeks
    const minInfectionTime = 14
    if (timeInfected < minInfectionTime) {
        return 0
    } else {
        var heuristic = 10.0
        return (timeInfected - minInfectionTime) / heuristic
    }
}

function death_function(timeInfected) {
    // these are both heuristics. decreasing minInfectionTime will rapidly increase death rate
    const minInfectionTime = 17
    var heuristic = 30.0
    if (timeInfected < 14) {
        return 0
    } else {
        return (timeInfected - minInfectionTime) / heuristic
    }
}

function infected_function(timeLatent) {
    // latent phase from 2 -14 days
    if (timeLatent < 2) {
        return 0
    } else {
        var heuristic = 12.0;
        return (timeLatent - 2.0) / heuristic;
    }
}

function asymptomatic_probability() {
    return .1
}

function moving_closer(person, otherPerson) {
    const keep = geometric.lineLength([
        geometric.pointTranslate(person.pos, person.angle, person.speed),
        geometric.pointTranslate(otherPerson.pos, otherPerson.angle, otherPerson.speed)
    ]),
    swap = geometric.lineLength([
        geometric.pointTranslate(person.pos, otherPerson.angle, otherPerson.speed),
        geometric.pointTranslate(otherPerson.pos, person.angle, person.speed)
    ])
    return keep < swap
}

function bounce(person, otherPerson) {
    const copy = Object.assign({}, person);
    person.angle = otherPerson.angle;
    person.speed = otherPerson.speed;
    otherPerson.angle = copy.angle;
    otherPerson.speed = copy.speed;
}
