/**
 * PS1-Style Shader Effects
 * Vertex jitter, low precision, flat shading for retro PS1 look
 */

/**
 * PS1 Vertex Shader
 * - Vertex jitter (snap to grid)
 * - Low precision coordinates
 */
export const PS1VertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // PS1 vertex jitter (snap to grid for affine texture mapping effect)
    float snapPrecision = 64.0; // Lower = more jitter
    mvPosition.xyz = floor(mvPosition.xyz * snapPrecision) / snapPrecision;
    
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * PS1 Fragment Shader
 * - Simple directional lighting
 * - Flat shading aesthetic
 * - Low color precision
 */
export const PS1FragmentShader = `
  uniform vec3 color;
  uniform float ambient;
  uniform vec3 lightDirection;
  uniform float lightIntensity;
  
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    // Normalize interpolated normal
    vec3 normal = normalize(vNormal);
    
    // Simple directional lighting (PS1 style)
    vec3 lightDir = normalize(lightDirection);
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Ambient + diffuse
    vec3 ambientColor = color * ambient;
    vec3 diffuseColor = color * diff * lightIntensity;
    vec3 finalColor = ambientColor + diffuseColor;
    
    // Clamp to reduce precision (PS1 effect)
    finalColor = floor(finalColor * 32.0) / 32.0;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * PS1 Shader with texture support
 */
export const PS1TexturedVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // PS1 vertex jitter
    float snapPrecision = 64.0;
    mvPosition.xyz = floor(mvPosition.xyz * snapPrecision) / snapPrecision;
    
    // Low-precision UV coordinates (affine texture mapping)
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const PS1TexturedFragmentShader = `
  uniform sampler2D map;
  uniform vec3 lightDirection;
  uniform float ambient;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  
  void main() {
    // Sample texture with nearest neighbor (pixelated)
    vec4 texColor = texture2D(map, vUv);
    
    // Simple lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(lightDirection);
    float diff = max(dot(normal, lightDir), 0.0);
    
    vec3 finalColor = texColor.rgb * (ambient + diff * (1.0 - ambient));
    
    // Reduce color precision (PS1 5-bit color per channel)
    finalColor = floor(finalColor * 32.0) / 32.0;
    
    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

