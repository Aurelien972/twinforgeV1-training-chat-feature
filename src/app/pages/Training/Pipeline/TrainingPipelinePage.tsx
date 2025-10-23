/**
 * Training Pipeline Page
 * Main container for the 5-step training generation pipeline
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrainingPipeline } from '../../../../system/store/trainingPipeline';
import { useBeforeUnload } from '../../../../hooks/useBeforeUnload';
import logger from '../../../../lib/utils/logger';
import TrainingProgressHeader from './components/TrainingProgressHeader';
import TrainingButton from './components/TrainingButton';
import Step1Preparer from './steps/Step1Preparer';
import Step2Activer from './steps/Step2Activer';
import Step3Seance from './steps/Step3Seance';
import Step4Adapter from './steps/Step4Adapter';
import Step5Avancer from './steps/Step5Avancer';

const TrainingPipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    steps,
    progress,
    isActive,
    startPipeline,
    cancelPipeline,
    sessionPrescription,
    currentSessionId
  } = useTrainingPipeline();

  const previousStepRef = useRef(currentStep);

  // Enable beforeunload protection for active sessions
  useBeforeUnload({
    enabled: true,
    message: 'Tu as un training en cours. Es-tu sûr de vouloir quitter ?',
    saveStateOnUnload: true,
    warnOnUnsavedChanges: true
  });

  // Log navigation within pipeline
  useEffect(() => {
    logger.info('TRAINING_PIPELINE_PAGE', 'Step rendered', {
      currentStep,
      sessionId: currentSessionId,
      hasPrescription: !!sessionPrescription,
      timestamp: new Date().toISOString()
    });
  }, [currentStep, currentSessionId, sessionPrescription]);

  useEffect(() => {
    if (!isActive) {
      startPipeline();
    }
  }, [isActive, startPipeline]);

  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      previousStepRef.current = currentStep;
    }
  }, [currentStep]);

  const handleCancel = () => {
    cancelPipeline();
    navigate('/training');
  };

  const renderStep = () => {
    const stepVariants = {
      initial: { opacity: 0, y: 30, scale: 0.96 },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.6,
          delay: 0.1,
          ease: [0.16, 1, 0.3, 1]
        }
      },
      exit: {
        opacity: 0,
        y: -30,
        scale: 0.96,
        transition: {
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1]
        }
      }
    };

    switch (currentStep) {
      case 'preparer':
        return (
          <motion.div key="preparer" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <Step1Preparer key={currentStep} />
          </motion.div>
        );
      case 'activer':
        return (
          <motion.div key="activer" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <Step2Activer key={currentStep} />
          </motion.div>
        );
      case 'seance':
        return (
          <motion.div key="seance" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <Step3Seance key={currentStep} />
          </motion.div>
        );
      case 'adapter':
        return (
          <motion.div key="adapter" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <Step4Adapter key={currentStep} />
          </motion.div>
        );
      case 'avancer':
        return (
          <motion.div key="avancer" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <Step5Avancer key={currentStep} />
          </motion.div>
        );
      default:
        return (
          <motion.div key="preparer" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <Step1Preparer key={currentStep} />
          </motion.div>
        );
    }
  };

  return (
    <div className="training-pipeline-page min-h-screen pb-12">
      {/* Progress Header (Non-Sticky) with Optimized Margins - Hidden during Step 3 (session mode) */}
      {currentStep !== 'seance' && (
        <TrainingProgressHeader
          steps={steps}
          currentStep={currentStep}
          progress={progress}
          className="mt-4 mb-6"
        />
      )}

      {/* Step Content with Transitions */}
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
};

export default TrainingPipelinePage;
