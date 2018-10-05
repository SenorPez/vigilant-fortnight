import math

import numpy

GRAV = 6.67259e-11
SOLAR_MASS = 0.75 * 1.9891e30
AU = 149597870700
GM = GRAV*SOLAR_MASS/AU**3
LOOP_LIMIT = 50

class Orbit:
    def __init__(self, a, e, i, omega, w, v_o):
        self.a = a #Semi-major axis (average orbit radius) (AU)
        self.e = e #Eccentricity
        self.i = i #Inclination
        self.omega = omega #Longitude of ascending node
        self.w = w #Argument of periapsis
        self.v_o = v_o #True anomaly at epoch

    def get_position(self, time):
        #Calculate mean anomaly
        orbitPeriod = 2*math.pi*math.sqrt(self.a**3/GM)/(365.26*24*3600)
        M = 2.0*math.pi*time/orbitPeriod

        E = M
        loopCount = 0
        while loopCount < LOOP_LIMIT:
            loopCount += 1
            trial_M = E - self.e*math.sin(E)
            if abs(trial_M-M) < 1.0e-6: break
            E -= trial_M - M

        cos_v = (math.cos(E) - self.e)/(1 - self.e*math.cos(E))
        sin_v = (math.sqrt(1 - self.e*self.e)*math.sin(E))/(1 - self.e*math.cos(E))
        r = self.a*(1 - self.e*self.e)/(1 + self.e*cos_v)
        theta = math.atan2(r*sin_v, r*cos_v) + self.omega + self.w

        return numpy.array([r*math.cos(theta), r*math.sin(theta), 0])

    def transfer_orbit(self, dest_orbit, start_time, transfer_time):
        r1_vec = self.get_position(start_time)
        r1 = numpy.linalg.norm(r1_vec)
        r2_vec = dest_orbit.get_position(start_time+transfer_time)
        r2 = numpy.linalg.norm(r2_vec)
        delta_v = math.acos(numpy.dot(r1_vec, r2_vec)/(r1*r2))
        if numpy.cross(r1_vec, r2_vec)[2] < 0:
            delta_v = 2*math.pi - delta_v
        k = r1*r2*(1 - math.cos(delta_v))
        l = r1 + r2
        m = r1*r2*(1 + math.cos(delta_v))
        p_i = k/(l + math.sqrt(2*m))
        p_ii = k/(l - math.sqrt(2*m))

        if delta_v < math.pi:
            trial_low = p_i
            trial_high = p_i*2
        else:
            trial_low = 0
            trial_high = p_ii

        p1 = (trial_high + trial_low)/2*0.25
        p2 = (trial_high + trial_low)/2*0.75
        t = transfer_time*365.26*24*3600

        loopCount = 0
        while loopCount < LOOP_LIMIT:
            loopCount += 1
            t1 = self.calc_time(p1, k, l, m, r1, r2, delta_v)
            t2 = self.calc_time(p2, k, l, m, r1, r2, delta_v)
            if abs(t - t1) < 1.0e-6: break

            pn = p2 + ((t - t2)*(p2 - p1))/(t2 - t1)
            p1 = p2
            p2 = pn

        p = p1
        a = m*k*p/((2*m - l*l)*p*p + 2*k*l*p - k*k)
        v1_vec, v2_vec = self.calc_vectors(r1_vec, r2_vec, p, a, delta_v)
        return self.orbit_elements(r1_vec, v1_vec)

    def calc_vectors(self, r1_vec, r2_vec, p, a, delta_v):
        r1 = numpy.linalg.norm(r1_vec)
        r2 = numpy.linalg.norm(r2_vec)

        f = 1 - r2/p*(1 - math.cos(delta_v))
        g = r1*r2*math.sin(delta_v)/math.sqrt(GM*p)
        f_dot = math.sqrt(GM/p)*math.tan(delta_v/2)*((1 - math.cos(delta_v))/p - 1/r1 - 1/r2)
        g_dot = 1 - r1/p*(1 - math.cos(delta_v))

        v1_vec = (r2_vec - f*r1_vec)/g
        v2_vec = (f_dot*r1_vec + g_dot*v1_vec)
        return v1_vec, v2_vec

    def calc_time(self, p, k, l, m, r1, r2, delta_v):
        a = m*k*p/((2*m - l*l)*p*p + 2*k*l*p - k*k)
        f = 1 - r2/p*(1 - math.cos(delta_v))
        g = r1*r2*math.sin(delta_v)/math.sqrt(GM*p)
        f_dot = math.sqrt(GM/p)*math.tan(delta_v/2)*((1 - math.cos(delta_v))/p - 1/r1 - 1/r2)

        if a > 0:
            cos_delta_e = 1 - (r1/a)*(1 - f)
            sin_delta_e = -r1*r2*f_dot/math.sqrt(GM*a)
            delta_e = math.atan2(sin_delta_e, cos_delta_e)
            t = g + math.sqrt(math.pow(a, 3)/GM)*(delta_e - math.sin(delta_e))
        else:
            delta_f = math.acosh(1 - (r1/a)*(1 - f))
            t = g + math.sqrt(math.pow(-a, 3)/GM)*(math.sinh(delta_f) - delta_f)

        return t

    def orbit_elements(self, r_vec, v_vec):
        r = numpy.linalg.norm(r_vec)
        v = numpy.linalg.norm(v_vec)

        h_vec = numpy.cross(r_vec, v_vec)
        h = numpy.linalg.norm(h_vec)
        n_vec = numpy.cross(numpy.array([0, 0, 1]), h_vec)

        e_vec = ((v*v - GM/r)*r_vec - numpy.dot(r_vec, v_vec)*v_vec)/GM
        e = numpy.linalg.norm(e_vec)

        a = 1/(2/r - v*v/GM)

        i = math.acos(h_vec[2]/h)

        N = math.acos(e_vec[0]/e)
        if e_vec[1] < 0:
            N = 2*math.pi - N

        v = math.acos(numpy.dot(e_vec, r_vec)/(e*r))
        if numpy.dot(r_vec, v_vec) < 0:
            v = 2*math.pi - v

        return Orbit(a, e, 0, 0, N, v)

        
home_orbit = Orbit(0.500757, 0.05, 0, 0, 0, 0)
dest_orbit = Orbit(0.801212, 0.05, 0, 0, 2*math.pi*0.535421, 0)
transfer_time = 50 / 365.26
transfer_orbit = home_orbit.transfer_orbit(dest_orbit, 0, transfer_time)

print("{}, {}, {}, {}, {}".format(
    home_orbit.a,
    home_orbit.e,
    2*math.pi*math.sqrt(home_orbit.a**3/GM)/(365.26*24*3600),
    home_orbit.w,
    home_orbit.v_o))
print("{}, {}, {}, {}, {}".format(
    dest_orbit.a,
    dest_orbit.e,
    2*math.pi*math.sqrt(dest_orbit.a**3/GM)/(365.26*24*3600),
    dest_orbit.w,
    dest_orbit.v_o))
print("{}, {}, {}, {}, {}".format(
    transfer_orbit.a,
    transfer_orbit.e,
    2*math.pi*math.sqrt(transfer_orbit.a**3/GM)/(365.26*24*3600),
    transfer_orbit.w,
    transfer_orbit.v_o))
