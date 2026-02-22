import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { RoutineGenerator } from '../components/RoutineGenerator';
import { ProgramService } from '../services/programService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const ProgramManager = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleRoutineGenerated = async (newProgram: any) => {
        const id = crypto.randomUUID();
        const programToSave = {
            ...newProgram,
            id,
            userId: user?.uid || 'guest',
            version: 1
        };
        await ProgramService.saveProgram(programToSave);
        navigate(`/program/${id}`);
    };

    return (
        <div className="space-y-6">
            <RoutineGenerator onRoutineGenerated={handleRoutineGenerated} />
            
            <Card>
                <CardHeader>
                    <CardTitle>Program Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Edit your routines and exercises here.</p>
                </CardContent>
            </Card>
        </div>
    );
};
