/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useEffect, useState } from "react";

type UseReadyStateProps = {
  isReady: boolean;
  isHydrating: boolean;
};

export function useReadyState({ isReady, isHydrating }: UseReadyStateProps) {
  const [isFormReady, setReadyState] = useState(isReady);
  const [isTimerCompleted, setTimerStatus] = useState(isReady);

  useEffect(() => {
    if (isFormReady) {
      return;
    }

    if (isTimerCompleted && !isHydrating) {
      setReadyState(true);
    }
  }, [isFormReady, isTimerCompleted, isHydrating]);

  function markTimerAsCompleted() {
    setTimerStatus(true);
  }

  return {
    isFormReady,
    markTimerAsCompleted,
  };
}
