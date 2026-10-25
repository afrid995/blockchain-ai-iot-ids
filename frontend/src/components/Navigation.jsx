import React from 'react';

export const CONSOLE_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', subtitle: 'System Overview & Session Summary' },
  { id: 'detection', label: 'Intrusion Detection', icon: '⚡', subtitle: 'Network-Flow Analysis' },
  { id: 'model-security', label: 'Model Security', icon: '🛡️', subtitle: 'Provenance & Integrity Gate' },
  { id: 'security-testing', label: 'Security Testing', icon: '🧪', subtitle: 'Controlled Fail-Closed Testing' },
  { id: 'audit', label: 'Audit Log', icon: '📜', subtitle: 'Local Operational Events' },
  { id: 'research-results', label: 'Research Results', icon: '📑', subtitle: 'Empirical Evaluation & Metrics' },
];

export function Navigation({ activeTab, onSelectTab }) {
  return (
    <nav className="nav-tabs-container" aria-label="Main Navigation">
      <div className="nav-tabs">
        {CONSOLE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`tab-${tab.id}`}
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
