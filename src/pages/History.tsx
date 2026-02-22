import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export const History = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Workout History</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-500">Analytics and history logs will appear here.</p>
            </CardContent>
        </Card>
    );
};
