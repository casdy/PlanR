import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export const ProgramManager = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Program Management</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-500">Edit your routines and exercises here.</p>
            </CardContent>
        </Card>
    );
};
