import styles from './Button.module.css';

type Props = {
  /** Display elements inside the button such as text label */
  children: React.ReactNode;
  /** Function to call when button is clicked */
  onClick: () => void;
};

/**
 * Button component
 */
export const Button = ({ children, onClick }: Props) => {
  return (
    <button className={styles.button} onClick={onClick}>
      {children}
    </button>
  );
};
