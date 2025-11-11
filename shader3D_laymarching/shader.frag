precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;

// 기본 SDF들
float sdSphere(vec3 p,float r){return length(p)-r;}
float sdPlane(vec3 p,vec3 n,float h){// n은 정규화 가정
    return dot(p,n)+h;
}

// 씬 거리장: 구 + 바닥
float map(vec3 p){
    float s=sdSphere(p-vec3(0.,.6*sin(uTime*.7)+.5,3.),.7);
    float g=sdPlane(p,vec3(0.,1.,0.),0.);// y=0 바닥
    return min(s,g);
}

// 법선 추정
vec3 getNormal(vec3 p){
    float e=.001;
    vec2 h=vec2(1.,-1.)*.5773;
    return normalize(
        h.xyy*map(p+h.xyy*e)+
        h.yyx*map(p+h.yyx*e)+
        h.yxy*map(p+h.yxy*e)+
        h.xxx*map(p+h.xxx*e)
    );
}

// 간단한 레이마칭
float raymarch(vec3 ro,vec3 rd){
    float t=0.;
    for(int i=0;i<100;i++){
        vec3 p=ro+rd*t;
        float d=map(p);
        if(d<.001)return t;
        t+=d;
        if(t>100.)break;
    }
    return-1.;
}

void main(){
    // NDC → 카메라 레이
    vec2 uv=(vUv*2.-1.);
    uv.x*=uRes.x/uRes.y;
    uv.y = -uv.y; // flip Y because vUv.y grows downward in screen space
    
    vec3 ro=vec3(0.,1.,-3.);// 카메라 위치
    vec3 look=vec3(0.,.5,3.);// 바라보는 점
    vec3 ww=normalize(look-ro);
    vec3 uu=normalize(cross(vec3(0.,1.,0.),ww));
    vec3 vv=cross(ww,uu);
    vec3 rd=normalize(uv.x*uu+uv.y*vv+0.8*ww);
    
    float t=raymarch(ro,rd);
    vec3 col;
    if(t>0.){
        vec3 p=ro+rd*t;
        vec3 n=getNormal(p);
        vec3 l=normalize(vec3(.6,1.,-.5));
        float diff=max(dot(n,l),0.);
        float amb=.2;
        col=vec3(.9,.95,1.)*amb+vec3(.9,.7,.5)*diff;
        
        // 바닥 체크: 거친 체커
        if(abs(map(p)-sdPlane(p,vec3(0,1,0),0.))<.001){
            float a = step(0.2, fract(p.x*0.5)*2.0);
            float b = step(0.5, fract(p.z*0.5)*2.0);
            float checker = abs(a-b);
            col=mix(col*.6,col*1.2,checker);
        }
    }else{
        // 히트 없음: 배경
        col=vec3(.5,.7,1.);
    }
    gl_FragColor=vec4(col,1.);
}