import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

type Props = {
  setIsLoggedIn: (value: boolean) => void;
  setRole: (role: 'customer' | 'carrier') => void;
};

export default function LoginScreen({ setIsLoggedIn, setRole }: Props) {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'carrier'>('customer');
  const [phone, setPhone] = useState('');

  const handleLogin = () => {
    console.log('Role:', selectedRole);
    console.log('Phone:', phone);

    setRole(selectedRole);
    setIsLoggedIn(true);
  };

  return (
    <View style={styles.container}>

      {/* Title */}
      <Text style={styles.title}>KhatKhat 🚀</Text>
      <Text style={styles.subtitle}>Hyperlocal Parcel Delivery</Text>

      {/* Role Selector */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === 'customer' && styles.activeRole
          ]}
          onPress={() => setSelectedRole('customer')}
        >
          <Text style={styles.roleText}>Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === 'carrier' && styles.activeRole
          ]}
          onPress={() => setSelectedRole('carrier')}
        >
          <Text style={styles.roleText}>Delivery Agent</Text>
        </TouchableOpacity>
      </View>

      {/* Phone Input */}
      <TextInput
        placeholder="Enter Phone Number"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        keyboardType="phone-pad"
      />

      {/* Login Button */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: 'gray',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeRole: {
    backgroundColor: '#6366F1',
  },
  roleText: {
    color: '#000',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#6366F1',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});