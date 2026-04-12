import { StyleSheet, Text, View } from 'react-native';

export default function FocusScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Focus Mode</Text>
			<Text style={styles.subtitle}>This screen is ready for your session tools and tasks.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#020617',
		padding: 24,
	},
	title: {
		color: '#f8fafc',
		fontSize: 30,
		fontWeight: '800',
		marginBottom: 10,
	},
	subtitle: {
		color: '#cbd5e1',
		fontSize: 16,
		textAlign: 'center',
	},
});
