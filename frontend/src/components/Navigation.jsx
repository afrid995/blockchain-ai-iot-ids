import React from 'react';

export function Navigation({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'architecture', label: 'Architecture', icon: '🏛️', subtitle: 'Guided Execution Workflow' },
    { id: 'live-test', label: 'Live Test', icon: '⚡', subtitle: 'Direct Inference Console' },
    { id: 'security-test', label: 'Security Test', icon: '🛡️', subtitle: 'Fail-Closed Demonstrator' },
    { id: 'research-metrics', label: 'Research Metrics', icon: '📊', subtitle: 'Statistical Evidence' },
    { id: 'audit', label: 'Audit Trail', icon: '📜', subtitle: 'Security Event Store' },
  ];

  return (
    <nav className="nav-tabs-container" aria-label="Main Navigation">
      <div className="nav-tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              type="button"
              role="tab"
              aria-selected={isActive}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              <div className="nav-tab-text">
                <span className="nav-tab-title">{tab.label}</span>
                <span className="nav-tab-subtitle">{tab.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
