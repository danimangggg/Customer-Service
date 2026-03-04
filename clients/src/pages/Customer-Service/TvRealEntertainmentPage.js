import React from 'react';
import TvRealEntertainment from '../../components/Customer-Service/TvRealEntertainment';
import ErrorBoundary from '../../components/ErrorBoundary';

const TvRealEntertainmentPage = () => {
  return (
    <ErrorBoundary autoReload={true}>
      <TvRealEntertainment />
    </ErrorBoundary>
  );
};

export default TvRealEntertainmentPage;