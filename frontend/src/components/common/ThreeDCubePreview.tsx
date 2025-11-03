import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Scene, WebGLRenderer, Mesh, PerspectiveCamera, DirectionalLight } from 'three';

interface ThreeDCubePreviewProps {
  cameraPosition: string;
  cameraAngle: number;
  cameraDistance: number; // 카메라 거리 추가
  lensType: string; // 렌즈 타입 추가
  cameraRotationX: number; // 절대값 X 회전 추가
  cameraRotationY: number; // 절대값 Y 회전 추가
  screenPositionX: number; // 화면상 좌우 위치 추가
  screenPositionY: number; // 화면상 위아래 위치 추가
  lightingDirection: string;
  lightingIntensity: string;
  lightingShadows: string;
  aspectRatio?: string; // 화면 비율 추가
  // 새로운 props 추가
  lensFocalLength?: number; // 렌즈 초점거리
  compressionEffect?: string; // 원근감 압축 효과
  tiltAngle?: number; // 카메라 틸트 각도
  panAngle?: number; // 카메라 팬 각도 (좌우 회전)
  rollAngle?: number; // 카메라 롤 각도 (프레임 회전)
  gridPosition?: { x: number; y: number }; // 화면 그리드 기준 위치
  motionBlur?: string; // 모션 블러 효과
  depthOfField?: string; // 피사계 심도
}

export const ThreeDCubePreview: React.FC<ThreeDCubePreviewProps> = ({
  cameraPosition,
  cameraAngle,
  cameraDistance,
  lensType,
  cameraRotationX,
  cameraRotationY,
  screenPositionX,
  screenPositionY,
  lightingDirection,
  lightingIntensity,
  lightingShadows,
  aspectRatio = '1:1',
  lensFocalLength = 50,
  compressionEffect = 'normal',
  tiltAngle = 0,
  panAngle = 0, // 카메라 팬 각도 (좌우 회전)
  rollAngle = 0, // 카메라 롤 각도 (프레임 회전)
  gridPosition = { x: 0, y: 0 },
  motionBlur = 'none',
  depthOfField = 'medium'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cubeRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const lightRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 기존 자식 요소 모두 제거 (중복 렌더링 방지)
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // Scene 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6); // bg-gray-100
    sceneRef.current = scene;

    // 화면 비율에 따른 크기 계산
    const getPreviewSize = () => {
      const baseSize = 160; // 기본 크기 (2배로 확대)
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      const aspectRatioValue = widthRatio / heightRatio;
      
      if (aspectRatioValue > 1) {
        // 가로가 더 긴 경우 (16:9, 4:3 등)
        return {
          width: baseSize * aspectRatioValue,
          height: baseSize
        };
      } else {
        // 세로가 더 긴 경우 (9:16, 3:4 등)
        return {
          width: baseSize,
          height: baseSize / aspectRatioValue
        };
      }
    };

    const previewSize = getPreviewSize();

    // Camera 생성 - 렌즈 타입에 따른 FOV 설정
    const getFOV = () => {
      switch (lensType) {
        case 'wide':
          return 90; // 와이드 렌즈
        case 'standard':
          return 75; // 표준 렌즈
        case 'telephoto':
          return 50; // 망원 렌즈
        case 'macro':
          return 60; // 매크로 렌즈
        default:
          return 75; // 기본값
      }
    };

    const camera = new THREE.PerspectiveCamera(getFOV(), previewSize.width / previewSize.height, 0.1, 1000);
    
    // 카메라 위치 계산 (팬/틸트/롤 각도 반영)
    let cameraX = 0;
    let cameraY = 0;
    let cameraZ = 0;
    
    // 기본 카메라 거리
    const baseDistance = cameraDistance * 2;
    
    // 팬 각도 (좌우 회전) 적용
    const panRad = (panAngle * Math.PI) / 180;
    cameraX = Math.sin(panRad) * baseDistance;
    cameraZ = Math.cos(panRad) * baseDistance;
    
    // 틸트 각도 (위아래 회전) 적용
    const tiltRad = (tiltAngle * Math.PI) / 180;
    cameraY = Math.sin(tiltRad) * baseDistance;
    
    // 카메라 위치 설정
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(0, 0, 0);
    
    // 롤 각도 (프레임 회전) 적용
    if (rollAngle !== 0) {
      const rollRad = (rollAngle * Math.PI) / 180;
      camera.rotation.z = rollRad;
    }
    
    cameraRef.current = camera;

    // Renderer 생성
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(previewSize.width, previewSize.height); // 화면 비율에 맞춰 크기 설정
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 큐브 Geometry 생성
    const geometry = new THREE.BoxGeometry(2, 2, 2);

    // 큐브 Materials 생성 - 밝고 눈에 띄는 색상으로 가독성 향상
    const materials = [
      new THREE.MeshLambertMaterial({ 
        color: 0x3b82f6, // 앞면 - 파란색 (눈에 띄는 색상)
        transparent: true,
        opacity: 0.8
      }),
      new THREE.MeshLambertMaterial({ 
        color: 0x60a5fa, // 뒷면 - 밝은 파란색
        transparent: true,
        opacity: 0.7
      }),
      new THREE.MeshLambertMaterial({ 
        color: 0x60a5fa, // 우측면 - 밝은 파란색
        transparent: true,
        opacity: 0.7
      }),
      new THREE.MeshLambertMaterial({ 
        color: 0x60a5fa, // 좌측면 - 밝은 파란색
        transparent: true,
        opacity: 0.7
      }),
      new THREE.MeshLambertMaterial({ 
        color: 0x93c5fd, // 상단면 - 더 밝은 파란색
        transparent: true,
        opacity: 0.6
      }),
      new THREE.MeshLambertMaterial({ 
        color: 0x93c5fd, // 하단면 - 더 밝은 파란색
        transparent: true,
        opacity: 0.6
      }),
    ];

    // 큐브 Mesh 생성
    const cube = new THREE.Mesh(geometry, materials);
    cube.castShadow = true;
    cube.receiveShadow = true;
    
    // 큐브 위치는 초기에는 원점에 설정 (화면상 위치는 카메라 lookAt으로 조정)
    cube.position.set(0, 0, 0);
    
    cubeRef.current = cube;
    scene.add(cube);

    // 큐브 외곽선 추가 (더 눈에 띄는 색상)
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x1e40af, // 진한 파란색 (더 눈에 띄는 색상)
      linewidth: 3 // 선 두께 증가
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    cube.add(wireframe);

    // 바닥 생성 - 투명한 바닥에 그리드 선만 표시
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    
    // 투명한 바닥 재질
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff, // 흰색
      transparent: true,
      opacity: 0.1 // 거의 투명하게
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // 바닥을 수평으로 회전
    floor.position.y = -1; // 큐브 아래에 배치
    floor.receiveShadow = true;
    scene.add(floor);

    // 그리드 선 생성
    const gridHelper = new THREE.GridHelper(10, 20, 0x6b7280, 0x6b7280);
    gridHelper.position.y = -0.99; // 바닥 위에 살짝 올려서 그리드 표시
    scene.add(gridHelper);

    // 조명 생성 - 개선된 기본 조명 (큐브 가독성 향상)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // 강도 증가
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // 강도 증가
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // 그림자 해상도 증가
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    lightRef.current = directionalLight;
    scene.add(directionalLight);

    // 애니메이션 루프
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      // 애니메이션 프레임 취소
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // 렌더러 DOM 요소 제거
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // 리소스 정리
      if (renderer) {
        renderer.dispose();
      }
      if (geometry) {
        geometry.dispose();
      }
      materials.forEach(material => material.dispose());
      
      // 참조 초기화
      sceneRef.current = null;
      rendererRef.current = null;
      cubeRef.current = null;
      cameraRef.current = null;
      lightRef.current = null;
    };
  }, []);

  // 카메라 위치 및 설정 업데이트
  useEffect(() => {
    if (!cameraRef.current || !cubeRef.current) return;

    const camera = cameraRef.current;
    const cube = cubeRef.current;

    // 화면 비율에 따른 크기 계산
    const getPreviewSize = () => {
      const baseSize = 160; // 기본 크기 (2배로 확대)
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      const aspectRatioValue = widthRatio / heightRatio;
      
      if (aspectRatioValue > 1) {
        // 가로가 더 긴 경우 (16:9, 4:3 등)
        return {
          width: baseSize * aspectRatioValue,
          height: baseSize
        };
      } else {
        // 세로가 더 긴 경우 (9:16, 3:4 등)
        return {
          width: baseSize,
          height: baseSize / aspectRatioValue
        };
      }
    };

    const previewSize = getPreviewSize();

    // 렌즈 타입에 따른 FOV 업데이트
    const getFOV = () => {
      switch (lensType) {
        case 'wide':
          return 90;
        case 'standard':
          return 75;
        case 'telephoto':
          return 50;
        case 'macro':
          return 60;
        default:
          return 75;
      }
    };

    camera.fov = getFOV();
    camera.aspect = previewSize.width / previewSize.height;
    camera.updateProjectionMatrix();

    // 렌더러 크기 업데이트
    if (rendererRef.current) {
      rendererRef.current.setSize(previewSize.width, previewSize.height);
    }

    // 카메라 거리 설정
    camera.position.z = cameraDistance;

    // 카메라 위치 설정 (화면상 위치 반영 - 이동과 회전 구분)
    let basePosition = new THREE.Vector3();
    
    // 기본 카메라 위치 설정 (카메라 위치 타입에 따라)
    switch (cameraPosition) {
      case 'front':
        basePosition.set(0, 0, cameraDistance);
        break;
      case 'right-side':
        basePosition.set(cameraDistance, 0, 0);
        break;
      case 'left-side':
        basePosition.set(-cameraDistance, 0, 0);
        break;
      case 'side':
        // Legacy support: default to right-side
        basePosition.set(cameraDistance, 0, 0);
        break;
      case 'back':
        basePosition.set(0, 0, -cameraDistance);
        break;
      case 'top':
        basePosition.set(0, cameraDistance, 0);
        break;
      case 'low-angle':
        basePosition.set(0, -cameraDistance * 0.3, cameraDistance * 0.8);
        break;
      case 'bird-eye':
        basePosition.set(0, cameraDistance * 1.2, cameraDistance * 0.6);
        break;
      case 'direct-down':
        basePosition.set(0, cameraDistance * 1.5, 0);
        break;
    }

    // 카메라 회전 적용 (회전 행렬 생성)
    // 요구사항 반영: 팬(+Y) = 화면 내 객체 좌측 이동, 틸트(+X) = 화면 내 객체 하측 이동
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(-tiltAngle),
      THREE.MathUtils.degToRad(panAngle),
      0,
      'XYZ'
    ));

    // 카메라 위치 계산
    // 1. 기본 위치에 회전 행렬 적용
    const rotatedPosition = basePosition.clone().applyMatrix4(rotationMatrix);
    camera.position.copy(rotatedPosition);

    // 카메라 회전 적용
    camera.rotation.x = THREE.MathUtils.degToRad(-tiltAngle);
    camera.rotation.y = THREE.MathUtils.degToRad(panAngle);

    // 카메라가 원점을 바라보도록 설정 (임시)
    camera.lookAt(0, 0, 0);
    
    // 카메라 업데이트하여 matrixWorld 갱신
    camera.updateMatrixWorld();

    // 큐브 회전 (기본 각도)
    cube.rotation.x = THREE.MathUtils.degToRad(cameraAngle);
    cube.rotation.y = THREE.MathUtils.degToRad(cameraAngle * 0.5);

    // 화면상 위치 조정: 큐브가 화면에 보이는 상태 기준으로 좌/우, 위/아래 이동
    // 카메라의 right/up 벡터를 사용하여 화면 공간 기준으로 이동
    const cameraRight = new THREE.Vector3();
    const cameraUp = new THREE.Vector3();
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize(); // 카메라 right 벡터 (화면 기준 우측)
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize(); // 카메라 up 벡터 (화면 기준 상단)
    
    // 화면상 위치를 화면 공간 기준으로 변환
    // screenPositionX: 양수=우측, 음수=좌측 (화면 기준)
    // screenPositionY: 양수=위, 음수=아래 (화면 기준)
    const screenOffsetDistance = cameraDistance * 0.3; // 화면 이동 거리 (카메라 거리에 비례)
    const screenOffsetX = (screenPositionX / 100) * screenOffsetDistance; // 가로 이동
    const screenOffsetY = (screenPositionY / 100) * screenOffsetDistance; // 세로 이동
    
    // lookAt 타겟을 화면 공간 기준으로 오프셋 적용
    // right 벡터로 가로 이동, up 벡터로 세로 이동
    const lookAtTarget = new THREE.Vector3(0, 0, 0)
      .add(cameraRight.multiplyScalar(-screenOffsetX)) // X: 양수일 때 화면 기준 우측 = 큐브가 좌측으로 보임
      .add(cameraUp.multiplyScalar(-screenOffsetY)); // Y: 양수일 때 화면 기준 위 = 큐브가 아래로 보임
    
    camera.lookAt(lookAtTarget);
  }, [cameraPosition, cameraAngle, cameraDistance, lensType, cameraRotationX, cameraRotationY, screenPositionX, screenPositionY, aspectRatio, tiltAngle, panAngle]);

  // 조명 업데이트
  useEffect(() => {
    if (!lightRef.current) return;

    const light = lightRef.current;

    // 조명 방향 설정
    switch (lightingDirection) {
      case 'front':
        light.position.set(0, 0, 5);
        break;
      case 'side':
        light.position.set(5, 0, 0);
        break;
      case 'back':
        light.position.set(0, 0, -5);
        break;
      case 'top':
        light.position.set(0, 5, 0);
        break;
      case 'bottom':
        light.position.set(0, -5, 0);
        break;
    }

    // 조명 강도 설정
    switch (lightingIntensity) {
      case 'low':
        light.intensity = 0.3;
        break;
      case 'medium':
        light.intensity = 0.6;
        break;
      case 'high':
        light.intensity = 1.0;
        break;
    }

    // 그림자 설정
    light.shadow.bias = lightingShadows === 'hard' ? -0.0001 : -0.0005;
  }, [lightingDirection, lightingIntensity, lightingShadows]);

  return (
    <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
      <div 
        ref={mountRef}
        className="flex items-center justify-center"
        style={{ 
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          width: 'fit-content',
          height: 'fit-content',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
};
