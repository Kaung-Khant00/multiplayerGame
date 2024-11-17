class Projectile{
    constructor({x,y,radius,color,velocity}){
        this.x=x
        this.y=y
        this.radius=radius
        this.color=color
        this.velocity=velocity
        this.check=0
    }
    draw(){
        c.beginPath()
        c.arc(this.x,this.y,this.radius,0,Math.PI*2,false)
        c.fillStyle=this.color
        c.fill()
    }
}

