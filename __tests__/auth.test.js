import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUp from '../Screens/SignUp';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Mock Firebase modules
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    createUserWithEmailAndPassword: jest.fn(),
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
      })),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(),
    },
  }),
}));

describe('SignUp Component', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show validation errors for empty fields', async () => {
    const { getByText, getByPlaceholderText } = render(
      <SignUp navigation={mockNavigation} />
    );

    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(getByText('Name is required')).toBeTruthy();
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('should show error for invalid email format', async () => {
    const { getByText, getByPlaceholderText } = render(
      <SignUp navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Enter your email');
    fireEvent.changeText(emailInput, 'invalid-email');

    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('should show error for password mismatch', async () => {
    const { getByText, getByPlaceholderText } = render(
      <SignUp navigation={mockNavigation} />
    );

    const passwordInput = getByPlaceholderText('Enter your password');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');

    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password456');

    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('should successfully create user account', async () => {
    const mockUser = {
      user: {
        uid: 'test-uid',
        updateProfile: jest.fn(),
      },
    };

    auth().createUserWithEmailAndPassword.mockResolvedValueOnce(mockUser);

    const { getByText, getByPlaceholderText } = render(
      <SignUp navigation={mockNavigation} />
    );

    // Fill in all required fields
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(auth().createUserWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(mockUser.user.updateProfile).toHaveBeenCalledWith({
        displayName: 'Test User',
      });
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });
  });

  it('should handle email already in use error', async () => {
    auth().createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
    });

    const { getByText, getByPlaceholderText } = render(
      <SignUp navigation={mockNavigation} />
    );

    // Fill in all required fields
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'existing@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

    const signUpButton = getByText('Sign Up');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(getByText('Email is already registered')).toBeTruthy();
    });
  });
}); 