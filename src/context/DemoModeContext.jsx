import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  isDemoModeActive, 
  getDemoCurrentStep, 
  setDemoState, 
  DEMO_STEPS,
  DEMO_STORAGE_KEY_ACTIVE,
  DEMO_STORAGE_KEY_STEP
} from '../services/demoScenario';

const DemoModeContext = createContext({
  isDemoActive: false,
  currentStep: 1,
  totalSteps: 9,
  stepInfo: DEMO_STEPS[0],
  startDemo: () => {},
  advanceStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  resetDemo: () => {},
  exitDemo: () => {},
  triggerHiddenLinkDiscovery: () => {}
});

export function DemoModeProvider({ children }) {
  const navigate = useNavigate();

  const [isDemoActiveState, setIsDemoActiveState] = useState(() => isDemoModeActive());
  const [currentStepState, setCurrentStepState] = useState(() => getDemoCurrentStep());

  // Sync state with sessionStorage & window events
  useEffect(() => {
    const handleStateChange = (e) => {
      if (e.detail) {
        setIsDemoActiveState(Boolean(e.detail.active));
        setCurrentStepState(Number(e.detail.step || 1));
      } else {
        setIsDemoActiveState(isDemoModeActive());
        setCurrentStepState(getDemoCurrentStep());
      }
    };

    window.addEventListener('netra_demo_state_change', handleStateChange);
    window.addEventListener('storage', handleStateChange);
    return () => {
      window.removeEventListener('netra_demo_state_change', handleStateChange);
      window.removeEventListener('storage', handleStateChange);
    };
  }, []);

  const currentStepInfo = DEMO_STEPS[Math.max(0, Math.min(currentStepState - 1, DEMO_STEPS.length - 1))];

  const startDemo = useCallback(() => {
    setDemoState(true, 1);
    setIsDemoActiveState(true);
    setCurrentStepState(1);
    navigate(DEMO_STEPS[0].route);
  }, [navigate]);

  const goToStep = useCallback((stepNum) => {
    const validStep = Math.max(1, Math.min(stepNum, DEMO_STEPS.length));
    setDemoState(true, validStep);
    setIsDemoActiveState(true);
    setCurrentStepState(validStep);
    const targetRoute = DEMO_STEPS[validStep - 1].route;
    navigate(targetRoute);
  }, [navigate]);

  const advanceStep = useCallback(() => {
    if (currentStepState < DEMO_STEPS.length) {
      goToStep(currentStepState + 1);
    } else {
      // At step 9, clicking restart will go back to step 1
      goToStep(1);
    }
  }, [currentStepState, goToStep]);

  const prevStep = useCallback(() => {
    if (currentStepState > 1) {
      goToStep(currentStepState - 1);
    }
  }, [currentStepState, goToStep]);

  const resetDemo = useCallback(() => {
    goToStep(1);
  }, [goToStep]);

  const exitDemo = useCallback(() => {
    setDemoState(false, 1);
    setIsDemoActiveState(false);
    setCurrentStepState(1);
    navigate('/dashboard');
  }, [navigate]);

  const triggerHiddenLinkDiscovery = useCallback(() => {
    if (currentStepState < 4) {
      goToStep(4);
    }
  }, [currentStepState, goToStep]);

  return (
    <DemoModeContext.Provider
      value={{
        isDemoActive: isDemoActiveState,
        currentStep: currentStepState,
        totalSteps: DEMO_STEPS.length,
        stepInfo: currentStepInfo,
        startDemo,
        advanceStep,
        prevStep,
        goToStep,
        resetDemo,
        exitDemo,
        triggerHiddenLinkDiscovery
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
