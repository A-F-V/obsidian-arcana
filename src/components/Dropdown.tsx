import * as React from 'react';
import { useState } from 'react';

const Dropdown = ({ options }: { options: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const toggling = () => setIsOpen(!isOpen);

  const onOptionClicked = (value: string) => () => {
    setSelectedOption(value);
    setIsOpen(false);
  };

  return (
    <div className="dd-wrapper">
      <div
        tabIndex={0}
        className="dd-header"
        role="button"
        onClick={() => toggling()}
      >
        <div className="dd-header__title">
          <p className="dd-header__title--bold">
            {selectedOption || 'Select an option'}
          </p>
        </div>
        <div className="dd-header__action">
          <p>{isOpen ? 'Close' : 'Open'}</p>
        </div>
      </div>
      {isOpen && (
        <ul className="dd-list">
          {options.map((option, i) => (
            <li
              className="dd-list-item"
              key={i}
              onClick={onOptionClicked(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
