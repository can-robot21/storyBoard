import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Scene, WebGLRenderer, PerspectiveCamera, Mesh, DirectionalLight } from 'three';

interface ThreeDPreviewProps {
  config: {
    camera: {
      height: string;
      distance: string;
      angle: string;
      horizontalPosition: string;
      verticalPosition: string;
      tilt: string;
      lensSize: string;
      previewShape: string;
    };
    lighting: {
      type: string;
      direction: string;
      intensity: string;
      shadows: string;
    };
    effect: {
      focus: string;
      depthOfField: string;
      tiltShift: string;
      filter: string;
    };
  };
}

// WebGL 지원 체크 함수
const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};

// iPad 감지 함수
const isIPad = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// 폴백 모드 컴포넌트 (2D 아이콘)
const FallbackPreview: React.FC<{ config: ThreeDPreviewProps['config'] }> = ({ config }) => {
  const getAngleIcon = () => {
    switch (config.camera.angle) {
      case 'front': return '📷';
      case 'side': return '📸';
      case 'top-view': return '📹';
      case 'bird-eye': return '🦅';
      case 'direct-down': return '⬇️';
      case 'high-angle': return '📐';
      case 'low-angle': return '📏';
      case 'diagonal': return '📊';
      default: return '📷';
    }
  };

  const getDistanceIcon = () => {
    switch (config.camera.distance) {
      case 'close': return '🔍';
      case 'medium': return '📏';
      case 'far': return '🔭';
      case 'very-far': return '🛰️';
      default: return '📏';
    }
  };

  const getTiltIcon = () => {
    switch (config.camera.tilt) {
      case 'tilt-left': return '↖️';
      case 'tilt-right': return '↗️';
      default: return '➡️';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-gray-700 flex items-center gap-2">
          📱 2D 미리보기 (폴백 모드)
        </h5>
        <div className="text-xs text-gray-500">
          {config.camera.previewShape === 'cube' ? '📦 큐브' : '🌐 구'}
        </div>
      </div>
      
      {/* 2D 아이콘 미리보기 */}
      <div className="w-full border border-gray-200 rounded-md bg-gray-50 overflow-hidden flex items-center justify-center"
           style={{ height: '200px', position: 'relative' }}>
        <div className="text-center">
          <div className="text-6xl mb-2">{getAngleIcon()}</div>
          <div className="text-sm text-gray-600 mb-1">
            앵글: {config.camera.angle}
          </div>
          <div className="text-sm text-gray-600 mb-1">
            거리: {getDistanceIcon()} {config.camera.distance}
          </div>
          <div className="text-sm text-gray-600 mb-1">
            기울기: {getTiltIcon()} {config.camera.tilt}
          </div>
          <div className="text-sm text-gray-600">
            높이: {config.camera.height}
          </div>
        </div>
      </div>
      
      {/* 색상별 방향 설명 */}
      <div className="mt-3 text-xs text-gray-600 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
          <span>전면 (앞쪽)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-black rounded"></div>
          <span>위/아래</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded"></div>
          <span>측면</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <span>바닥</span>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          📱 iPad/모바일 환경에서 2D 미리보기 모드
        </div>
        <div className="text-xs text-gray-500">
          💡 설정은 프롬프트에 정상적으로 반영됩니다
        </div>
      </div>
    </div>
  );
};

export const ThreeDPreview: React.FC<ThreeDPreviewProps> = ({ config }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const cubeRef = useRef<any>(null);
  const sphereRef = useRef<any>(null);
  const lightRef = useRef<any>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  // WebGL 지원 체크
  useEffect(() => {
    const supported = checkWebGLSupport();
    setWebglSupported(supported);
    
    if (!supported) {
      console.warn('WebGL not supported, using fallback mode');
    }
  }, []);

  // 모든 useEffect를 Hook 순서를 유지하면서 조건부로 실행
  useEffect(() => {
    // WebGL이 지원되지 않거나 iPad인 경우 3D 렌더링 건너뛰기
    if (webglSupported === false || isIPad()) {
      return;
    }

    if (!mountRef.current) return;

    try {
      // Scene 생성
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8f9fa);
      sceneRef.current = scene;

      // Camera 생성
      const camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
      camera.position.set(0, 0, 5);
      cameraRef.current = camera;

      // Renderer 생성 (iPad 최적화)
      const renderer = new THREE.WebGLRenderer({ 
        antialias: false, // iPad에서 성능 향상
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "low-power" // iPad 배터리 절약
      });
      renderer.setSize(300, 200);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // iPad에서 성능 향상
      renderer.shadowMap.enabled = false; // 그림자 비활성화로 성능 향상
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '200px';
      renderer.domElement.style.display = 'block';
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 기본 조명만 설정 (단순화)
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
      lightRef.current = directionalLight;

      // 3D 큐브 생성 - 단순한 색상 적용
      const cubeGeometry = new THREE.BoxGeometry(1, 1.5, 1);
      
      // 단순한 색상 적용 (전면 흰색, 위아래 검은색)
      const cubeMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF }), // 앞면 - 흰색
        new THREE.MeshBasicMaterial({ color: 0xCCCCCC }), // 뒷면 - 회색
        new THREE.MeshBasicMaterial({ color: 0x000000 }), // 윗면 - 검은색
        new THREE.MeshBasicMaterial({ color: 0x000000 }), // 아랫면 - 검은색
        new THREE.MeshBasicMaterial({ color: 0xCCCCCC }), // 오른쪽면 - 회색
        new THREE.MeshBasicMaterial({ color: 0xCCCCCC })  // 왼쪽면 - 회색
      ];
      
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
      cube.position.set(0, 0, 0);
      scene.add(cube);
      cubeRef.current = cube;

      // 큐브 외곽선 추가 (단순한 회색)
      const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
      const cubeLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x666666, 
        linewidth: 2 
      });
      const cubeWireframe = new THREE.LineSegments(cubeEdges, cubeLineMaterial);
      cube.add(cubeWireframe);

      // 3D 구 생성 - 단순한 색상
      const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16); // 복잡도 감소
      
      // 단순한 재질 사용 (셰이더 제거)
      const sphereMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xCCCCCC,
        transparent: true,
        opacity: 0.7
      });
      
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(0, 0, 0);
      sphere.visible = false; // 초기에는 숨김
      scene.add(sphere);
      sphereRef.current = sphere;

      // 구 외곽선 추가 (단순한 회색)
      const sphereEdges = new THREE.EdgesGeometry(sphereGeometry);
      const sphereLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x666666, 
        linewidth: 2 
      });
      const sphereWireframe = new THREE.LineSegments(sphereEdges, sphereLineMaterial);
      sphere.add(sphereWireframe);

      // 바닥 평면 생성 (단순화)
      const planeGeometry = new THREE.PlaneGeometry(10, 10);
      const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xF0F0F0,
        transparent: true,
        opacity: 0.5
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -1;
      scene.add(plane);

      // 방향 표시기 추가 (X, Y, Z 축) - 단순화
      const axesHelper = new THREE.AxesHelper(1.5);
      axesHelper.position.set(0, 0, 0);
      scene.add(axesHelper);

      // 그리드 생성 (단순화)
      const gridHelper = new THREE.GridHelper(20, 10, 0xCCCCCC, 0xCCCCCC);
      gridHelper.position.y = -0.99;
      scene.add(gridHelper);

      // 정적 렌더링 (애니메이션 없음)
      const render = () => {
        renderer.render(scene, camera);
      };
      
      // 초기 렌더링
      render();

      // 정리 함수
      return () => {
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (error) {
      console.error('3D 렌더링 초기화 실패:', error);
      setWebglSupported(false);
    }
  }, [webglSupported]); // webglSupported 의존성 추가

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Scene 생성
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8f9fa);
      sceneRef.current = scene;

      // Camera 생성
      const camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
      camera.position.set(0, 0, 5);
      cameraRef.current = camera;

      // Renderer 생성 (iPad 최적화)
      const renderer = new THREE.WebGLRenderer({ 
        antialias: false, // iPad에서 성능 향상
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "low-power" // iPad 배터리 절약
      });
      renderer.setSize(300, 200);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // iPad에서 성능 향상
      renderer.shadowMap.enabled = false; // 그림자 비활성화로 성능 향상
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '200px';
      renderer.domElement.style.display = 'block';
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 기본 조명만 설정 (단순화)
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
      lightRef.current = directionalLight;

      // 3D 큐브 생성 - 단순한 색상 적용
      const cubeGeometry = new THREE.BoxGeometry(1, 1.5, 1);
      
      // 단순한 색상 적용 (전면 흰색, 위아래 검은색)
      const cubeMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF }), // 앞면 - 흰색
        new THREE.MeshBasicMaterial({ color: 0xCCCCCC }), // 뒷면 - 회색
        new THREE.MeshBasicMaterial({ color: 0x000000 }), // 윗면 - 검은색
        new THREE.MeshBasicMaterial({ color: 0x000000 }), // 아랫면 - 검은색
        new THREE.MeshBasicMaterial({ color: 0xCCCCCC }), // 오른쪽면 - 회색
        new THREE.MeshBasicMaterial({ color: 0xCCCCCC })  // 왼쪽면 - 회색
      ];
      
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
      cube.position.set(0, 0, 0);
      scene.add(cube);
      cubeRef.current = cube;

      // 큐브 외곽선 추가 (단순한 회색)
      const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
      const cubeLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x666666, 
        linewidth: 2 
      });
      const cubeWireframe = new THREE.LineSegments(cubeEdges, cubeLineMaterial);
      cube.add(cubeWireframe);

      // 3D 구 생성 - 단순한 색상
      const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16); // 복잡도 감소
      
      // 단순한 재질 사용 (셰이더 제거)
      const sphereMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xCCCCCC,
        transparent: true,
        opacity: 0.7
      });
      
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(0, 0, 0);
      sphere.visible = false; // 초기에는 숨김
      scene.add(sphere);
      sphereRef.current = sphere;

      // 구 외곽선 추가 (단순한 회색)
      const sphereEdges = new THREE.EdgesGeometry(sphereGeometry);
      const sphereLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x666666, 
        linewidth: 2 
      });
      const sphereWireframe = new THREE.LineSegments(sphereEdges, sphereLineMaterial);
      sphere.add(sphereWireframe);

      // 바닥 평면 생성 (단순화)
      const planeGeometry = new THREE.PlaneGeometry(10, 10);
      const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xF0F0F0,
        transparent: true,
        opacity: 0.5
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -1;
      scene.add(plane);

      // 방향 표시기 추가 (X, Y, Z 축) - 단순화
      const axesHelper = new THREE.AxesHelper(1.5);
      axesHelper.position.set(0, 0, 0);
      scene.add(axesHelper);

      // 그리드 생성 (단순화)
      const gridHelper = new THREE.GridHelper(20, 10, 0xCCCCCC, 0xCCCCCC);
      gridHelper.position.y = -0.99;
      scene.add(gridHelper);

      // 정적 렌더링 (애니메이션 없음)
      const render = () => {
        renderer.render(scene, camera);
      };
      
      // 초기 렌더링
      render();

      // 정리 함수
      return () => {
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (error) {
      console.error('3D 렌더링 초기화 실패:', error);
      setWebglSupported(false);
    }
  }, []);

  // 설정 변경에 따른 업데이트 (앵글과 각도만 유지)
  useEffect(() => {
    // WebGL이 지원되지 않거나 iPad인 경우 업데이트 건너뛰기
    if (webglSupported === false || isIPad()) {
      return;
    }

    if (!sceneRef.current || !cameraRef.current || !lightRef.current || !cubeRef.current || !sphereRef.current || !rendererRef.current) return;

    try {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const light = lightRef.current;
      const cube = cubeRef.current;
      const sphere = sphereRef.current;
      const renderer = rendererRef.current;

      // 피사체 모양 변경
      if (config.camera.previewShape === 'cube') {
        cube.visible = true;
        sphere.visible = false;
      } else {
        cube.visible = false;
        sphere.visible = true;
      }

      // 카메라 위치 계산 (앵글별 최적 거리 범위 적용)
      let baseDistance = config.camera.distance === 'close' ? 3 : 
                        config.camera.distance === 'medium' ? 5 : 
                        config.camera.distance === 'far' ? 7 : 9;
      
      // 앵글별 최적 거리 범위 적용
      let cameraDistance = baseDistance;
      if (config.camera.angle === 'top-view' || config.camera.angle === 'direct-down') {
        cameraDistance = baseDistance * 0.7;
      } else if (config.camera.angle === 'bird-eye') {
        cameraDistance = baseDistance * 0.8;
      } else if (config.camera.angle === 'side' || config.camera.angle === 'diagonal') {
        cameraDistance = baseDistance * 1.2;
      }
      
      // 매크로 렌즈 선택 시 거리 자동 조정
      if (config.camera.lensSize === 'macro') {
        cameraDistance = Math.min(cameraDistance, 2);
      }
      
      // 거리에 따른 높이 자동 조정
      const baseHeight = config.camera.height === 'low' ? 0.5 : 
                        config.camera.height === 'medium' ? 1 : 
                        config.camera.height === 'high' ? 1.5 : 2;
      
      const distanceHeightMultiplier = cameraDistance / 5;
      const cameraHeight = baseHeight * distanceHeightMultiplier;
      
      const horizontalPos = config.camera.horizontalPosition === 'left' ? -1 : 
                           config.camera.horizontalPosition === 'right' ? 1 : 0;
      
      const verticalPos = config.camera.verticalPosition === 'up' ? 1 : 
                         config.camera.verticalPosition === 'down' ? -1 : 0;

      // 카메라 위치 설정
      camera.position.set(
        horizontalPos * cameraDistance,
        cameraHeight + verticalPos * 2,
        cameraDistance
      );

      // 카메라가 피사체를 바라보도록 설정
      camera.lookAt(0, 0, 0);

      // 카메라 기울기 적용 (앵글별 최적 기울기)
      if (config.camera.tilt === 'tilt-left') {
        if (config.camera.angle === 'top-view' || config.camera.angle === 'direct-down') {
          camera.rotation.z = Math.PI / 8; // 22.5도
        } else if (config.camera.angle === 'bird-eye') {
          camera.rotation.z = Math.PI / 10; // 18도
        } else {
          camera.rotation.z = Math.PI / 12; // 15도
        }
      } else if (config.camera.tilt === 'tilt-right') {
        if (config.camera.angle === 'top-view' || config.camera.angle === 'direct-down') {
          camera.rotation.z = -Math.PI / 8; // -22.5도
        } else if (config.camera.angle === 'bird-eye') {
          camera.rotation.z = -Math.PI / 10; // -18도
        } else {
          camera.rotation.z = -Math.PI / 12; // -15도
        }
      } else {
        camera.rotation.z = 0; // 수평
      }

      // 카메라 앵글 적용 (모든 앵글을 상대값으로 통일)
      if (config.camera.angle === 'high-angle') {
        camera.position.y += 2;
      } else if (config.camera.angle === 'low-angle') {
        camera.position.y -= 1;
      } else if (config.camera.angle === 'side') {
        camera.position.x += horizontalPos * 2;
      } else if (config.camera.angle === 'diagonal') {
        camera.position.x += horizontalPos * 1.5;
        camera.position.y += 1;
      } else if (config.camera.angle === 'top-view') {
        camera.position.y += 6;
        camera.position.z -= cameraDistance;
      } else if (config.camera.angle === 'bird-eye') {
        camera.position.y += 4;
        camera.position.z -= cameraDistance * 0.6;
      } else if (config.camera.angle === 'direct-down') {
        camera.position.y += 8;
        camera.position.z -= cameraDistance;
      }
      
      // 모든 앵글에서 lookAt 적용
      camera.lookAt(0, 0, 0);

      // 렌즈 사이즈에 따른 시야각 조정 (mm 단위)
      if (config.camera.lensSize === '14mm') {
        camera.fov = 115;
      } else if (config.camera.lensSize === '24mm') {
        camera.fov = 84;
      } else if (config.camera.lensSize === '50mm') {
        camera.fov = 47;
      } else if (config.camera.lensSize === '85mm') {
        camera.fov = 29;
      } else if (config.camera.lensSize === '135mm') {
        camera.fov = 18;
      } else if (config.camera.lensSize === '200mm') {
        camera.fov = 12;
      } else if (config.camera.lensSize === 'macro') {
        camera.fov = 47;
      } else if (config.camera.lensSize === 'fisheye') {
        camera.fov = 180;
      }
      camera.updateProjectionMatrix();

      // 기본 조명 방향만 설정 (단순화)
      const lightDistance = 5;
      if (config.lighting.direction === 'front') {
        light.position.set(0, 2, lightDistance);
      } else if (config.lighting.direction === 'side') {
        light.position.set(lightDistance, 2, 0);
      } else if (config.lighting.direction === 'back') {
        light.position.set(0, 2, -lightDistance);
      } else if (config.lighting.direction === 'top') {
        light.position.set(0, lightDistance, 0);
      }

      // 설정 변경 후 렌더링
      renderer.render(scene, camera);
    } catch (error) {
      console.error('3D 렌더링 업데이트 실패:', error);
    }
  }, [config, webglSupported]); // webglSupported 의존성 추가

  // 렌더링 로직을 조건부로 처리
  if (webglSupported === false || isIPad()) {
    return <FallbackPreview config={config} />;
  }

  // WebGL 지원 체크 중
  if (webglSupported === null) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-center" style={{ height: '200px' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">WebGL 지원 체크 중...</div>
          </div>
        </div>
      </div>
    );
  }

  // 3D 렌더링 (WebGL 지원 시)
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-gray-700 flex items-center gap-2">
          🎮 3D 미리보기 (최적화)
        </h5>
        <div className="text-xs text-gray-500">
          {config.camera.previewShape === 'cube' ? '📦 3D 큐브' : '🌐 3D 구'}
        </div>
      </div>
      
      <div 
        ref={mountRef} 
        className="w-full border border-gray-200 rounded-md bg-gray-50 overflow-hidden"
        style={{ height: '200px', position: 'relative' }}
      />
      
      {/* 색상별 방향 설명 */}
      <div className="mt-3 text-xs text-gray-600 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
          <span>전면 (앞쪽)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-black rounded"></div>
          <span>위/아래</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded"></div>
          <span>측면</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <span>바닥</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>X축 (빨강)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Y축 (초록)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Z축 (파랑)</span>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          💡 앵글과 각도만 실시간 반영됩니다
        </div>
        <div className="text-xs text-gray-500">
          📐 색상, 조명, 효과는 프롬프트에만 적용됩니다
        </div>
      </div>
    </div>
  );
};