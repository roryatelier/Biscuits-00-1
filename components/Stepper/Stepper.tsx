import styles from './Stepper.module.css';

interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
  orientation?: 'horizontal' | 'vertical';
}

export default function Stepper({
  steps,
  currentStep,
  completedSteps = [],
  orientation = 'horizontal',
}: StepperProps) {
  return (
    <div className={`${styles.stepper} ${styles[orientation]}`}>
      {steps.map((step, i) => {
        const isDone = completedSteps.includes(step.id);
        const isActive = currentStep === step.id;
        return (
          <div
            key={step.id}
            className={`${styles.step} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''}`}
          >
            <div className={styles.dot}>
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>{step.id}</span>
              )}
            </div>
            {i < steps.length - 1 && <div className={styles.connector} />}
            <span className={styles.label}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
